import asyncio
import websockets
import json

async def simulate_interview():
    uri = "ws://localhost:8000/interview/stream/candidate_123"
    
    async with websockets.connect(uri) as websocket:
        print("🔗 Connected. Type your message and press Enter (or 'quit' to exit).")
        
        while True:
            user_text = input("You: ")
            if user_text.lower() == 'quit':
                break

            # Send to FastAPI
            await websocket.send(json.dumps({"text": user_text}))

            # Wait for response
            response = await websocket.recv()
            data = json.loads(response)
            
            print(f"🤖 AI ({data['model_used']}): {data['text']}")

if __name__ == "__main__":
    try:
        asyncio.run(simulate_interview())
    except KeyboardInterrupt:
        print("\nManual exit.")