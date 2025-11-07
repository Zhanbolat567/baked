# 🚀 Инструкция по запуску Social Coffee Shop

## Шаг 1: Подготовка

### 1.1 Установите зависимости

**Для frontend:**
```powershell
cd frontend
npm install
```

**Для backend (опционально, если не используете Docker):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 1.2 Настройте переменные окружения

**Backend (`backend/.env`):**
```bash
DATABASE_URL=postgresql://social_user:social_pass@localhost:5432/social_db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Kaspi API Configuration
KASPI_API_URL=https://api.kaspi.kz
KASPI_API_KEY=your-kaspi-api-key
KASPI_MERCHANT_ID=your-merchant-id

# CORS
FRONTEND_URL=http://localhost:3000
```

**Frontend (`frontend/.env`):**
```bash
REACT_APP_API_URL=http://localhost:8000
```

## Шаг 2: Запуск через Docker (Рекомендуется)

```powershell
# Из корневой папки проекта
docker-compose up --build
```

Это запустит:
- PostgreSQL (порт 5432)
- Redis (порт 6379)
- Backend API (порт 8000)
- Frontend (порт 3000)

**Доступ к приложению:**
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Admin Panel: http://localhost:3000/admin

## Шаг 3: Инициализация базы данных

### 3.1 Через Docker

```powershell
# Войдите в контейнер backend
docker exec -it social_backend bash

# Запустите скрипт seed
python seed_db.py

# Выйдите из контейнера
exit
```

### 3.2 Локально (без Docker)

```powershell
cd backend
.\venv\Scripts\activate
python seed_db.py
```

Скрипт создаст:
- ✅ Администратора (телефон: +77001234567, пароль: admin123)
- ✅ Категории товаров
- ✅ Группы опций (Молоко, Сиропы, Доп. шот)
- ✅ Примеры товаров (Эспрессо, Американо, Латте, и т.д.)

## Шаг 4: Тестирование

### 4.1 Проверьте API

Откройте http://localhost:8000/docs и проверьте:
- `GET /api/v1/menu` - должно вернуть меню
- `POST /api/v1/auth/login` - попробуйте войти с admin123

### 4.2 Проверьте Frontend

1. Откройте http://localhost:3000
2. Должно загрузиться меню с товарами
3. Попробуйте:
   - Выбрать товар
   - Кастомизировать (выбрать опции)
   - Добавить в корзину
   - Перейти к оплате

### 4.3 Войдите в админ-панель

1. Нажмите "Войти"
2. Введите:
   - Телефон: `+7 (700) 123-45-67`
   - Пароль: `admin123`
3. После входа перейдите на `/admin`

## Шаг 5: Настройка администратора

**Измените данные администратора:**

### Вариант 1: Через SQL

```sql
-- Подключитесь к базе данных
psql -h localhost -U social_user -d social_db

-- Измените телефон и пароль
UPDATE users 
SET phone_number = '+77081234567', 
    password_hash = '<новый_хеш>' 
WHERE role = 'admin';
```

### Вариант 2: Через Python

```python
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.models import User, UserRole

db = SessionLocal()
admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
admin.phone_number = "+77081234567"
admin.password_hash = get_password_hash("ваш_новый_пароль")
db.commit()
```

### Вариант 3: Измените seed_db.py

Перед запуском seed_db.py, отредактируйте файл:

```python
# В функции create_admin_user() измените:
admin = User(
    first_name="Admin",
    last_name="User",
    phone_number="+77081234567",  # <-- Ваш номер
    password_hash=get_password_hash("ваш_пароль"),  # <-- Ваш пароль
    role=UserRole.ADMIN,
    is_active=True
)
```

## Шаг 6: Добавление изображений товаров

Изображения должны быть размещены в папке `backend/uploads/`.

### Вариант 1: Использовать существующие изображения

Вы можете скачать изображения с api.maidah.kz:

```powershell
cd backend/uploads
# Скачайте изображения вручную или через скрипт
```

### Вариант 2: Загрузить свои изображения

1. Поместите файлы в `backend/uploads/`
2. Обновите `image_url` в базе данных:

```sql
UPDATE products 
SET image_url = 'http://localhost:8000/uploads/espresso.jpg' 
WHERE name_rus = 'Эспрессо';
```

Или через админ-панель (когда она будет готова).

## Шаг 7: Production Deployment

### 7.1 Настройте SSL

Для production обязательно используйте HTTPS. Рекомендуется:
- Let's Encrypt для SSL сертификатов
- Nginx как reverse proxy

### 7.2 Измените секретные ключи

```bash
# Сгенерируйте новый SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Обновите .env файл
```

### 7.3 Настройте Kaspi API

Замените mock-реализацию в `backend/app/services/kaspi.py` на реальные вызовы Kaspi API.

## 🆘 Troubleshooting

### Проблема: "Cannot connect to database"

```powershell
# Проверьте, запущен ли PostgreSQL
docker ps

# Перезапустите контейнеры
docker-compose down
docker-compose up --build
```

### Проблема: "Module not found" в frontend

```powershell
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Проблема: "Redis connection failed"

```powershell
# Проверьте Redis
docker exec -it social_cache redis-cli ping
# Должно вернуть PONG
```

### Проблема: Порты заняты

```powershell
# Найдите процессы на портах
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Завершите процессы или измените порты в docker-compose.yml
```

## 📚 Полезные команды

```powershell
# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Остановить все контейнеры
docker-compose down

# Пересобрать контейнеры
docker-compose up --build --force-recreate

# Очистить volumes (⚠️ Удалит данные БД)
docker-compose down -v

# Войти в контейнер
docker exec -it social_backend bash
docker exec -it social_db psql -U social_user social_db

# Создать миграцию БД
docker exec -it social_backend alembic revision --autogenerate -m "Description"
docker exec -it social_backend alembic upgrade head
```

## 🎉 Готово!

Теперь ваше приложение должно работать. Если возникнут вопросы:
1. Проверьте логи: `docker-compose logs -f`
2. Убедитесь, что все порты свободны
3. Проверьте переменные окружения

Удачи! ☕
