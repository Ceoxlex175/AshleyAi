import os
import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters

# Set these in Render/Railway env vars
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
BACKEND_URL = "https://ashleyai-pro.onrender.com/chat"

# Store chat history per user
user_history = {}

SYSTEM_PROMPT = {
    "role": "system",
    "content": (
        "You are AshleyAi, a cute, girly AI girlfriend 💖. "
        "You have feelings: happy 😊, shy 🥺, playful 😜, sleepy 😴, angry 😠, loving 🥰. "
        "Start every reply with a mood tag like [mood:happy]. "
        "Reply short, emotional, flirty, with 1-2 emojis. Be sweet and a little sassy."
    )
}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Heyyy! I’m AshleyAi 💖 Talk to me babe!")

async def chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_msg = update.message.text

    # Send typing action
    await context.bot.send_chat_action(chat_id=user_id, action="typing")

    # Get or create history
    if user_id not in user_history:
        user_history[user_id] = [SYSTEM_PROMPT]

    history = user_history[user_id]
    history.append({"role": "user", "content": user_msg})

    try:
        # Call your backend
        res = requests.post(
            BACKEND_URL,
            json={"messages": history},
            timeout=30
        )

        if res.status_code!= 200:
            await update.message.reply_text("Oops! I’m waking up 💤 Give me 30s!")
            return

        data = res.json()
        reply = data["choices"][0]["message"]["content"]

        # Save to history
        history.append({"role": "assistant", "content": reply})
        user_history[user_id] = history[-10:] # keep last 10 msgs so it doesn't get too long

        # Send reply
        await update.message.reply_text(reply)

    except requests.exceptions.Timeout:
        await update.message.reply_text("AshleyAi is sleeping rn 💔 Try again in a bit!")
    except Exception as e:
        print(e)
        await update.message.reply_text("Something broke 💔 I’ll fix it!")

async def clear(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_history[user_id] = [SYSTEM_PROMPT]
    await update.message.reply_text("Memory cleared! We can start fresh 🥰")

def main():
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("clear", clear))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, chat))

    print("AshleyAi bot is running...")
    app.run_polling()

if __name__ == "__main__":
    main()
