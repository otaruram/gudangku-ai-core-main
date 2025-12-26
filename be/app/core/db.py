from prisma import Prisma

db = Prisma()

async def connect_db():
    try:
        if not db.is_connected():
            await db.connect()
    except Exception as e:
        print(f"Database Connect Error: {e}")

async def disconnect_db():
    if db.is_connected():
        await db.disconnect()
