import asyncio
from app.database import init_db, engine
from app.models import db_models  # registers ORM models with Base.metadata
from sqlalchemy import text

async def test():
    await init_db()
    print("DB tables created successfully")
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table'")
        )
        tables = [r[0] for r in result]
        print("Tables:", tables)

asyncio.run(test())
