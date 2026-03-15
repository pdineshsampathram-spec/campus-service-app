import motor.motor_asyncio
import asyncio
from config import settings
import logging
from core.database import init_db_core, get_database

logger = logging.getLogger("uvicorn")

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []

    async def find_one(self, query):
        for item in self.data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return item
        return None

    def find(self, query=None):
        return MockCursor(self.data, query)

    async def insert_one(self, document):
        if "_id" not in document:
            import uuid
            document["_id"] = str(uuid.uuid4())
        self.data.append(document)
        return document

    async def insert_many(self, documents):
        for doc in documents:
            if "_id" not in doc:
                import uuid
                doc["_id"] = str(uuid.uuid4())
        self.data.extend(documents)
        return documents

    async def count_documents(self, query):
        cursor = self.find(query)
        return len(cursor._results)

    async def update_one(self, query, update):
        item = await self.find_one(query)
        if item and "$set" in update:
            item.update(update["$set"])
        return item

    async def delete_one(self, query):
        item = await self.find_one(query)
        if item:
            self.data.remove(item)
        return item

class MockCursor:
    def __init__(self, data, query=None):
        self._data = data
        self._query = query or {}
        self._results = self._apply_query()
        self._pos = 0

    def _apply_query(self):
        results = []
        for item in self._data:
            match = True
            for k, v in self._query.items():
                if isinstance(v, dict):
                    # Handle operators like $in, $gte, etc.
                    for op, val in v.items():
                        item_val = item.get(k)
                        if op == "$in":
                            if item_val not in val:
                                match = False; break
                        elif op == "$gte":
                            if not (item_val is not None and item_val >= val):
                                match = False; break
                        elif op == "$lte":
                            if not (item_val is not None and item_val <= val):
                                match = False; break
                        elif op == "$gt":
                            if not (item_val is not None and item_val > val):
                                match = False; break
                        elif op == "$lt":
                            if not (item_val is not None and item_val < val):
                                match = False; break
                    if not match: break
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                results.append(item)
        return results

    def sort(self, field, direction=-1):
        self._results.sort(key=lambda x: x.get(field), reverse=(direction == -1))
        return self

    def limit(self, n):
        self._results = self._results[:n]
        return self

    def skip(self, n):
        self._results = self._results[n:]
        return self

    async def to_list(self, length=None):
        if length is not None:
             return self._results[:length]
        return self._results

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._pos >= len(self._results):
            raise StopAsyncIteration
        res = self._results[self._pos]
        self._pos += 1
        return res

class CollectionProxy:
    def __init__(self, name):
        self._name = name
        self._current = MockCollection(name)

    def __getattr__(self, name):
        return getattr(self._current, name)

    def _set_backend(self, backend):
        self._current = backend

# Persistent collection references used across the app
users_collection = CollectionProxy("users")
orders_collection = CollectionProxy("orders")
library_bookings_collection = CollectionProxy("library_bookings")
library_seats_collection = CollectionProxy("library_seats")
certificate_requests_collection = CollectionProxy("certificate_requests")
exam_notifications_collection = CollectionProxy("exam_notifications")
complaints_collection = CollectionProxy("complaints")
canteens_collection = CollectionProxy("canteens")

db_mode = "MOCK"

class DatabaseProxy:
    def __init__(self):
        self._current = None

    def __getattr__(self, name):
        current = self._current
        if current is not None:
            return getattr(current, name)
        return CollectionProxy(name)

    def __getitem__(self, name):
        current = self._current
        if current is not None:
            return current[name]
        return CollectionProxy(name)

    def _set_backend(self, backend):
        self._current = backend

db = DatabaseProxy()

async def create_indexes(db_instance):
    try:
        await db_instance.users.create_index("email", unique=True)
        await db_instance.orders.create_index("user_id")
        
        # Unique reservation constraints
        await db_instance.library_bookings.create_index(
            [("user_id", 1), ("date", 1), ("status", 1)], 
            unique=True,
            partialFilterExpression={"status": "confirmed"}
        )
        await db_instance.library_bookings.create_index(
            [("seat_id", 1), ("date", 1), ("status", 1)], 
            unique=True,
            partialFilterExpression={"status": "confirmed"}
        )
        
        await db_instance.complaints.create_index("user_id")
        await db_instance.certificate_requests.create_index("user_id")
        logger.info("✅ Database indexes initialized")
    except Exception as e:
        logger.warning(f"⚠️ Index creation skipped or failed: {e}")

async def init_db():
    global db_mode
    real_db = await init_db_core()
    
    if real_db is not None:
        # Switch all proxies to real MongoDB collections
        db._set_backend(real_db)
        users_collection._set_backend(real_db["users"])
        orders_collection._set_backend(real_db["orders"])
        library_bookings_collection._set_backend(real_db["library_bookings"])
        library_seats_collection._set_backend(real_db["library_seats"])
        certificate_requests_collection._set_backend(real_db["certificate_requests"])
        exam_notifications_collection._set_backend(real_db["exam_notifications"])
        complaints_collection._set_backend(real_db["complaints"])
        canteens_collection._set_backend(real_db["canteens"])
        
        db_mode = "LIVE"
        logger.info("✅ Connected to MongoDB Atlas (LIVE MODE)")
        await create_indexes(real_db)
    else:
        db_mode = "MOCK"
        logger.warning("🚀 Starting in MOCK MODE (In-memory storage)")
