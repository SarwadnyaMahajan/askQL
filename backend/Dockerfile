FROM python:3.11

WORKDIR /app

# Install uv for fast, low-memory package installation
RUN pip install --no-cache-dir uv

# Limit concurrent build jobs for C/C++/Rust extensions to save memory
ENV MAX_CONCURRENCY=1
ENV MAKEFLAGS="-j1"
ENV GRPC_PYTHON_BUILD_EXT_COMPILER_JOBS=1
ENV CARGO_BUILD_JOBS=1

COPY requirements.txt .
# Use uv to install requirements (drastically reduces memory usage)
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


