import TelegramBot from "node-telegram-bot-api"
import express from "express";
import cors from "cors";

const token = '8150144207:AAFSkzp1PGl3d0rBEFPXKYuAkcspoE9uo6k';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/courses", description: "View courses" },
]);

bot.setMyDescription('This bot helps users browse and purchase full stack courses through a Telegram WebApp.')

const bootstrap = () => {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start" || text === "/courses") {
      await bot.sendMessage(
        chatId,
        text === "/start" ? "Welcome to Salimjonov Davron's Web App Bot!" : "Here are the courses available:",
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "View Courses",
                  web_app: { url: "https://salimjonovdavronwebtgbot.netlify.app/" },
                },
              ],
            ],
          },
        }
      );
    }

    if (msg.web_app_data?.data) {
      try {
        const data = JSON.parse(msg.web_app_data.data);

        if (!Array.isArray(data) || data.length === 0) {
          await bot.sendMessage(chatId, "Your cart is empty.");
          return;
        }

        let messageText = "🛒 *Your Orders:*\n\n";
        data.forEach((item, index) => {
          messageText += `${index + 1}. *${item.title}* — x${item.quantity}\n`;
        });

        const total = data.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        messageText += `\n💵 *Total:* ${total.toLocaleString("en-US", { style: "currency", currency: "USD" })}`;

        await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
      } catch (error) {
        console.error("Failed to parse web_app_data:", error);
        await bot.sendMessage(chatId, "❌ Something went wrong processing your order.");
      }
    }
  });
};

bootstrap();

app.post('/web-data', async (req, res) => {
  const { queryId, products } = req.body;

  if (!queryId || !products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Invalid request: Empty cart or missing queryId" });
  }

  try {
    const total = products.reduce((acc, product) => acc + product.price * product.quantity, 0);
    const productList = products.map((c) => `*${c.title}* — x${c.quantity}`).join(', ');

    await bot.answerWebAppQuery(queryId, {
      type: "article",
      id: queryId,
      title: "Purchased Successfully",
      input_message_content: {
        message_text: `Your order has been successfully placed. You bought ${total.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })} worth of products: ${productList}`,
        parse_mode: "Markdown",
      },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /web-data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT || 8000, () => {
  console.log('Server started');
});