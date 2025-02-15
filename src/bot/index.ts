import { Bot, Context, NextFunction } from 'grammy';
import { Container } from '../container';

function buildBot(container: Container) {
  const bot = new Bot(container.config.telegramBotToken);

  bot.command('start', auth, async (ctx) => {
    const externalId = ctx.from.id.toString();

    const isUserExist = await container.userService.isUserExist(externalId);

    if (!isUserExist) {
      await ctx.reply('Please register first using /register command');

      return;
    }

    const user = await container.userService.getUserByIdOrExternalId(externalId);

    await ctx.reply(`Hello, ${user.firstName}! Welcome to Merlin! 🧙‍♂️`);
  });

  bot.command('register', auth, async (ctx) => {
    const externalId = ctx.from.id.toString();

    const isUserExist = await container.userService.isUserExist(externalId);

    if (isUserExist) {
      await ctx.reply('You are already registered!');

      return;
    }

    const firstName = ctx.from.first_name;
    const lastName = ctx.from.last_name;

    await container.userService.createUser({ externalId, firstName, lastName });

    await ctx.reply('You have been successfully registered!');
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
              content: `User Info: id=${user.id}, externalId=${user.externalId}, firstName=${user.firstName}, lastName=${user.lastName}`,
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

      await ctx.reply(replyMessage.content);
    } catch (error) {
      const errorMessage = error.message || 'An error occurred.';

      const agentResponse = await container.agentProvider.invoke(
        {
          messages: [
            container.agentProvider.buildChatMessage({
              role: 'developer',
              content: `User tried to send: ${message} but an error occurred: ${errorMessage}. Try to summarize the error message and provide a solution.`,
            }),
            container.agentProvider.buildChatMessage({
              role: 'developer',
              content: `Error message: ${errorMessage}`,
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
}

export default buildBot;
