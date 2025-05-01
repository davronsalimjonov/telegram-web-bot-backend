import TelegramBot from "node-telegram-bot-api";
import express from "express";
import cors from "cors";

const token = '7577844550:AAE-RwQ1Tif106BBjDCtAmk4RuPpCwrhTV0';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

bot.setMyCommands([
  { command: "/start", description: "Start the bot" },
  { command: "/courses", description: "View courses" },
]);

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
                  web_app: { url: "https://telegram-web-bot-amber.vercel.app/" },
                },
              ],
            ],
          },
        }
      );
    }
  });
};

bootstrap();

app.post('/web-data', async (req, res) => {
  const { queryId, chatId, products } = req.body; 

  if (!queryId || !chatId || !products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: "Invalid request: Empty cart, missing queryId, or missing chatId" });
  }

  try {
    const total = products.reduce((acc, product) => acc + product.price * product.quantity, 0);
    const productList = products.map((c) => `*${c.title}* — x${c.quantity}`).join(', ');

    await bot.sendMessage(
      chatId,
      `Your order has been successfully placed. You bought ${total.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })} worth of products: ${productList}`,
      { parse_mode: "Markdown" }
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /web-data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT || 8000, () => {
  console.log('Server started');
});
