from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import requests
import json

app = FastAPI()
EXPRESS_URL = "http://localhost:3000/api/models/best"

def get_healthy_model():
    """Queries Express for the best model."""
    try:
        res = requests.get(EXPRESS_URL, timeout=2)
        return res.json()['id']
    except:
        return "openai-gpt4" # Hardcoded safety fallback

@app.websocket("/interview/stream/{candidate_id}")
async def interview_stream(websocket: WebSocket, candidate_id: str):
    await websocket.accept()
    
    # Store history in memory for the duration of this socket connection
    conversation_history = []
    
    try:
        while True:
            # 1. Receive data from UI (could be raw audio or text-from-STT)
            data = await websocket.receive_text()
            user_input = json.loads(data)
            conversation_history.append({"role": "user", "content": user_input['text']})
            
            # 2. Get best model from Express Orchestrator
            selected_model = get_healthy_model()
            
            # 3. Execute with Fallback
            try:
                ai_response = execute_llm_call(selected_model, conversation_history)
            except Exception:
                print(f"⚠️ {selected_model} failed. Falling back...")
                requests.post(f"http://localhost:3000/api/models/{selected_model}/report-failure")
                fallback_model = get_healthy_model()
                ai_response = execute_llm_call(fallback_model, conversation_history)

            # 4. Send back to UI
            await websocket.send_json({
                "model_used": ai_response["model_used"],
                "text": ai_response["response"]
            })
            
            # Update history with AI response
            conversation_history.append({"role": "assistant", "content": ai_response["response"]})

    except WebSocketDisconnect:
        print(f"Client {candidate_id} disconnected")

def execute_llm_call(model_id, history):
    if model_id == "openai-gpt4":
        print(f"❌ Simulating a crash for {model_id}...")
        raise Exception("API Connection Timeout or Rate Limit reached")

    return {
        "model_used": model_id,
        "response": f"Successfully using {model_id}. History length: {len(history)}",
        "status": "success"
    }