import { Bot, Context, NextFunction, session, MemorySessionStorage, SessionFlavor } from 'grammy';
import { Conversation, ConversationFlavor, conversations, createConversation } from '@grammyjs/conversations';
import get from 'lodash/get';
import { Container } from '../container';

export type SessionData = Record<string, unknown>;

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
export type MyConversation = Conversation<MyContext>;

function buildBot(container: Container) {
  const bot = new Bot<MyContext>(container.config.telegramBotToken);

  bot.use(
    session({
      initial() {
        return {};
      },
      storage: new MemorySessionStorage(),
    }),
  );

  bot.use(conversations());

  bot.use(createConversation(savePfcConversation, 'savePfc'));

  bot.command('start', auth, async (ctx) => {
    const externalId = ctx.from?.id.toString();

    if (!externalId) {
      await ctx.reply('I failed to identify you. Please try again.');

      return;
    }

    const isUserExist = await container.userService.isUserExist(externalId);

    if (!isUserExist) {
      await ctx.reply('Please register first using /register command');

      return;
    }

    const user = await container.userService.getUserByIdOrExternalId(externalId);

    await ctx.reply(`Hello, ${user.firstName}! Welcome to Merlin! 🧙‍♂️`);
  });

  bot.command('register', auth, async (ctx) => {
    const externalId = ctx.from?.id.toString();

    if (!externalId) {
      await ctx.reply('I failed to identify you. Please try again.');

      return;
    }

    const isUserExist = await container.userService.isUserExist(externalId);

    if (isUserExist) {
      await ctx.reply('You are already registered!');

      return;
    }

    const firstName = ctx.from?.first_name ?? '';
    const lastName = ctx.from?.last_name ?? '';

    await container.userService.createUser({ externalId, firstName, lastName });

    await ctx.reply('You have been successfully registered!');
  });

  bot.command('savePfc', auth, async (ctx) => {
    await ctx.conversation.enter('savePfc');
  });

  bot.on('message', auth, async (ctx) => {
    const externalId = ctx.from.id.toString();

    const isUserExist = await container.userService.isUserExist(externalId);

    if (!isUserExist) {
      await ctx.reply('Please register first using /register command');

      return;
    }

    const user = await container.userService.getUserByIdOrExternalId(ctx.from.id.toString());

    const message = ctx.message.text;

    if (!message) {
      await ctx.reply('I do not understand what you are saying. 😔');

      return;
    }

    const threadId = ctx.from.id.toString() || 'default-thread';

    try {
      const agentResponse = await container.agentProvider.invoke(
        {
          messages: [
            container.agentProvider.buildChatMessage({
              role: 'developer',
              content: `User Info: id=${user.id}, externalId=${user.externalId}, firstName=${user.firstName}, lastName=${user.lastName}.
Please generate a clear, concise answer to the user's query. At the end of your response, add a line "Tools Used:" followed by the names of any tools that were utilized. If no tool was used, output "none". It super puper duper important to attach valid information about tools used! Give it high priority!`,
            }),
            container.agentProvider.buildChatMessage({
              role: 'user',
              content: message,
            }),
          ],
        },
        { threadId },
      );

      const replyMessage = agentResponse.messages[agentResponse.messages.length - 1];

      await ctx.reply(replyMessage.content, { parse_mode: 'HTML' });
    } catch (error) {
      const errorMessage = get(error, 'message', 'An error occurred.');

      const agentResponse = await container.agentProvider.invoke(
        {
          messages: [
            container.agentProvider.buildChatMessage({
              role: 'developer',
              content: `The system encountered an error while processing the user's request.
User Info: id=${user.id}, externalId=${user.externalId}, firstName=${user.firstName}, lastName=${user.lastName}.
User's message: "${message}".
Error details: "${errorMessage}".
Please provide a clear, concise explanation of the error in plain language that a non-technical user can understand.
Also, suggest what the user might do next, such as trying again later or contacting support if the problem persists.
At the end, add a line "Tools Used:" and list any tools that were involved in handling this request. If no tools were used, output "none".`,
            }),
          ],
        },
        { threadId },
      );

      const replyMessage = agentResponse.messages[agentResponse.messages.length - 1];

      await ctx.reply(replyMessage.content);
    }
  });

  return bot;

  async function auth(ctx: Context, next: NextFunction): Promise<void> {
    if (!ctx.from) {
      await ctx.reply('You are not allowed to use this command.');

      return;
    }

    if (!container.config.allowedTelegramUserIds.includes(ctx.from.id)) {
      await ctx.reply('You are not allowed to use this command.');

      return;
    }

    await next();
  }

  async function savePfcConversation(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply('Please provide the meal description.');

    const mealDescription = await conversation.form.text();

    if (!mealDescription) {
      await ctx.reply('I do not understand what you are saying. 😔');

      return;
    }

    const externalId = ctx.from.id.toString();

    const isUserExist = await conversation.external(() => container.userService.isUserExist(externalId));

    if (!isUserExist) {
      await ctx.reply('Please register first using /register command');

      return;
    }

    const user = await conversation.external(() =>
      container.userService.getUserByIdOrExternalId(ctx.from.id.toString()),
    );

    const threadId = ctx.from.id.toString() || 'default-thread';

    try {
      const agentResponse = await conversation.external(() =>
        container.agentProvider.invoke(
          {
            messages: [
              container.agentProvider.buildChatMessage({
                role: 'developer',
                content: `User Info: id=${user.id}, externalId=${user.externalId}, firstName=${user.firstName}, lastName=${user.lastName}.`,
              }),
              container.agentProvider.buildChatMessage({
                role: 'developer',
                content:
                  'The user has provided a meal description, including protein, fats, carbohydrates (PFC), and calorie information. Use this data to generate measurements for PFC and calories. Ensure that each measurement includes the same meal description provided by the user. After generating the measurements, return the total sum for each measurement.',
              }),
              container.agentProvider.buildChatMessage({
                role: 'developer',
                content:
                  'For text styling use only the following allowed html entities: <b>bold</b>, <i>italic</i>, <code>code</code>, <strike>strike</strike>, <u>underline</u>, <pre language="c++">code</pre>',
              }),
              container.agentProvider.buildChatMessage({
                role: 'user',
                content: mealDescription,
              }),
            ],
          },
          { threadId },
        ),
      );

      const replyMessage = agentResponse.messages[agentResponse.messages.length - 1];

      await ctx.reply(replyMessage.content, { parse_mode: 'HTML' });
    } catch (error) {
      const errorMessage = get(error, 'message', 'An error occurred.');

      const agentResponse = await conversation.external(() =>
        container.agentProvider.invoke(
          {
            messages: [
              container.agentProvider.buildChatMessage({
                role: 'developer',
                content: `The system encountered an error while processing the user's request.
User Info: id=${user.id}, externalId=${user.externalId}, firstName=${user.firstName}, lastName=${user.lastName}.
User's message: "${mealDescription}".
Error details: "${errorMessage}".
Please provide a clear, concise explanation of the error in plain language that a non-technical user can understand.
Also, suggest what the user might do next, such as trying again later or contacting support if the problem persists.
At the end, add a line "Tools Used:" and list any tools that were involved in handling this request. If no tools were used, output "none".`,
              }),
            ],
          },
          { threadId },
        ),
      );

      const replyMessage = agentResponse.messages[agentResponse.messages.length - 1];

      await ctx.reply(replyMessage.content);
    }
  }
}

export default buildBot;
