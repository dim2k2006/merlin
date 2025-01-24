import { Bot, Context, NextFunction } from 'grammy';
import { match } from 'ts-pattern';
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

  // https://grammy.dev/guide/filter-queries#combine-with-and
  // bot.on('message:photo', auth, async (ctx) => {
  //   console.log('ctx', ctx);
  //
  //   console.log('photo', ctx.update.message.photo);
  //   console.log('caption', ctx.update.message.caption);
  //
  //   await ctx.reply('Debugging forward photo. 😔');
  //
  //   await ctx.replyWithPhoto(ctx.update.message.photo[0].file_id);
  // });

  // bot.on('message:photo').on(':forward_origin', auth, async (ctx) => {
  //   console.log('ctx', ctx);
  //
  //   console.log('photo', ctx.update.message.photo);
  //
  //   await ctx.reply('Debugging forward photo. 😔');
  //
  //   await ctx.replyWithPhoto(ctx.update.message.photo[0].file_id);
  // });

  bot.on('message:text', auth, async (ctx) => {
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

    const intent = await container.llmProvider.identifyIntent({ message });

    const action = match(intent)
      .with('save', () => async () => {
        await container.memoryService.saveMemory({ userId: user.id, content: message });

        await ctx.react('👍');
      })
      .with('retrieve', () => async () => {
        const response = await container.memoryService.findRelevantMemories({
          userId: user.id,
          content: message,
          k: 50,
        });

        await ctx.reply(response);
      })
      .with('unknown', () => async () => {
        await ctx.reply('I do not understand your intent. 😔');
      })
      .exhaustive();

    await action();
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
