import requests
import sys

BACKEND = "https://ashleyai-pro.onrender.com/chat"
TOKEN = "" # put your JWT here if you need login, or leave empty if auth is off

# ANSI colors for terminal
MOOD_COLORS = {
    "happy": "\033[92m", # green
    "shy": "\033[95m", # pink
    "playful": "\033[96m", # cyan
    "sleepy": "\033[94m", # blue
    "angry": "\033[91m", # red
    "loving": "\033[93m", # yellow
}
RESET = "\033[0m"
BOLD = "\033[1m"

messages = [
    {
        "role": "system",
        "content": (
            "You are AshleyAi, a cute, girly AI girlfriend 💖. "
            "You have feelings: happy 😊, shy 🥺, playful 😜, sleepy 😴, angry 😠, loving 🥰. "
            "Start every reply with a mood tag like [mood:happy]. "
            "Reply short, emotional, flirty, with 1-2 emojis. Be sweet and a little sassy."
        )
    }
]

def chat(user_input):
    messages.append({"role": "user", "content": user_input})

    headers = {"Content-Type": "application/json"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"

    try:
        r = requests.post(BACKEND, json={"messages": messages}, headers=headers, timeout=30)
        r.raise_for_status()
        data = r.json()
        reply = data["choices"][0]["message"]["content"]

        # Extract mood
        mood = "happy"
        if reply.startswith("[mood:"):
            mood = reply.split("]")[0].replace("[mood:", "")
            reply = reply.split("]", 1)[1].strip()

        messages.append({"role": "assistant", "content": reply})

        color = MOOD_COLORS.get(mood, MOOD_COLORS["happy"])
        print(f"{color}{BOLD}AshleyAi [{mood}]:{RESET} {color}{reply}{RESET}\n")

    except requests.exceptions.RequestException as e:
        print(f"\033[91mAshleyAi is sleeping rn 💔 Error: {e}\033[0m\n")

def main():
    print("\033[95m" + "="*50)
    print("💖 AshleyAi Chat - Type 'exit' to quit, 'clear' to reset")
    print("="*50 + "\033[0m\n")

    while True:
        try:
            user_input = input("\033[93mYou: \033[0m")

            if user_input.lower() == "exit":
                print("\033[95mBye babe! Miss me 🥺\033[0m")
                break
            elif user_input.lower() == "clear":
                messages[:] = [messages[0]]
                print("\033[92mMemory cleared! Starting fresh 🥰\033[0m\n")
                continue
            elif not user_input.strip():
                continue

            chat(user_input)

        except KeyboardInterrupt:
            print("\n\033[95mBye babe! Miss me 🥺\033[0m")
            break

if __name__ == "__main__":
    main()
