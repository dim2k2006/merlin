import { Bot } from 'grammy';
import { match } from 'ts-pattern';
import { Container } from '../container';

function buildBot(container: Container) {
  const bot = new Bot(container.config.telegramBotToken);

  bot.command('start', async (ctx) => {
    const externalId = ctx.from.id.toString();

    const isUserExist = await container.userService.isUserExist(externalId);

    if (!isUserExist) {
      await ctx.reply('Please register first using /register command');

      return;
    }

    const user = await container.userService.getUserByIdOrExternalId(externalId);

    await ctx.reply(`Hello, ${user.firstName}! Welcome to Merlin! 🧙‍♂️`);
  });

  bot.command('register', async (ctx) => {
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

  bot.on('message', async (ctx) => {
    const externalId = ctx.from.id.toString();

    const isUserExist = await container.userService.isUserExist(externalId);

    if (!isUserExist) {
      await ctx.reply('Please register first using /register command');

      return;
    }

    const user = await container.userService.getUserByIdOrExternalId(ctx.from.id.toString());

    const intent = await container.llmProvider.identifyIntent({ message: ctx.message.text });

    const action = match(intent)
      .with('save', () => async () => {
        await container.memoryService.saveMemory({ userId: user.id, content: ctx.message.text });

        await ctx.react('👍');
      })
      .with('retrieve', () => async () => {
        const response = await container.memoryService.findRelevantMemories({
          userId: user.id,
          content: ctx.message.text,
          k: 50,
        });

        await ctx.reply(response);
      })
      .with('unknown', () => async () => {
        await ctx.reply('I do not understand what you are saying. 😔');
      })
      .exhaustive();

    await action();
  });

  return bot;
}

export default buildBot;
