import gradio as gr


def main():
    gr.load_chat(
        "https://4087-5-195-0-145.ngrok-free.app/v1", model="qwen3:32b", token="***"
    ).launch()
    print("Hello from gradiotest!")

if __name__ == "__main__":
    main()
