import TelegramBot from "node-telegram-bot-api";
import express from "express"
import cors from "cors"

const token = '7577844550:AAE-RwQ1Tif106BBjDCtAmk4RuPpCwrhTV0';

const bot = new TelegramBot(token, { polling: true });
const app = express()

app.use(express.json())
app.use(cors())

bot.setMyCommands([
    { command: "/start", description: "Start the bot" },
    { command: "/courses", description: "View courses" },
])

const bootstrap = () => {

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Handle /start command

        if (text === "/start") {
            await bot.sendMessage(chatId, "Welcome to Salimjonov Davron's Web App Bot!", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "View Courses",
                                web_app: {
                                    url: "https://telegram-web-bot-amber.vercel.app/"
                                }
                            }
                        ]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            })
        }

        if (text === "/courses") {
            await bot.sendMessage(chatId, "Here are the courses available:", {
                reply_markup: {
                    inline_keyboard: [[{ text: "View Courses", web_app: { url: "https://telegram-web-bot-amber.vercel.app/" } }]],
                }
            })
        }

        if (msg.web_app_data?.data) {
            try {
                const data = JSON.parse(msg.web_app_data.data);

                if (!Array.isArray(data) || data.length === 0) {
                    await bot.sendMessage(chatId, "Your cart is empty.");
                    return;
                }

                let messageText = `🛒 *Your Orders:*\n\n`;

                data.forEach((item, index) => {
                    messageText += `${index + 1}. *${item.title}* — x${item.quantity}\n`;
                });

                const total = data.reduce((acc, item) => acc + item.price * item.quantity, 0);

                messageText += `\n💵 *Total:* ${total.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD"
                })}`;

                await bot.sendMessage(chatId, messageText, { parse_mode: "Markdown" });
            } catch (error) {
                console.error("Failed to parse web_app_data:", error);
                await bot.sendMessage(chatId, "❌ Something went wrong processing your order.");
            }
        }
    });
}

bootstrap();

app.post('/web-data', async (req, res) => {
    const { queryId, products } = req.body;

    try {
        await bot.answerWebAppQuery(queryId, {
            type: "article",
            id: queryId,
            title: "Purchased Successfully",
            input_message_content: {
                message_text: `Your order has been successfully placed.You bought ${products
                    .reduce((acc, product) => {
                        return acc + product.price * product.quantity, 0;
                    })
                    .toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD"
                    })} worth of products. ${products.map(c => `*${c.title}* — x${c.quantity}X`).join(', ')
                    }`,
                parse_mode: "Markdown",
            },
        })
        return res.status(200).json({ success: true })
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" })
    }
})

app.listen(process.env.PORT || 8000, () => {
    console.log('Server started');
})