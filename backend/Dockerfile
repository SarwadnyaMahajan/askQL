FROM python:3.11

WORKDIR /app

# Upgrade pip to ensure latest wheel support
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Limit concurrent build jobs for C/C++/Rust extensions to save memory
ENV MAX_CONCURRENCY=1
ENV MAKEFLAGS="-j1"
ENV GRPC_PYTHON_BUILD_EXT_COMPILER_JOBS=1
ENV CARGO_BUILD_JOBS=1

COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


