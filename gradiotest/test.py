import gradio as gr
import requests
import json

API_URL = "https://4087-5-195-0-145.ngrok-free.app/api/generate"
MODEL_NAME = "qwen3:32b"


def chat_with_model(user_input, chat_history):
    messages = [{"role": "user", "content": user_input}]
    payload = {"model": MODEL_NAME, "messages": messages}
    response = requests.post(API_URL, json=payload)
    result = response.json()
    print(result)
    reply = result.get("message", {}).get("content", "[No response]")
    chat_history.append((user_input, reply))
    return "", chat_history


with gr.Blocks() as demo:
    gr.Markdown("# Chat with llama3.2")
    chatbot = gr.Chatbot()
    msg = gr.Textbox(label="Your message")
    send = gr.Button("Send")
    clear = gr.Button("Clear")

    state = gr.State([])

    send.click(chat_with_model, inputs=[msg, state], outputs=[msg, chatbot])
    clear.click(lambda: ([], ""), outputs=[chatbot, msg])

demo.launch()
