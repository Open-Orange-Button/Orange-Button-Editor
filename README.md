# OB Editor

Welcome to the OB Editor project. This document provides instructions for setting up and running the application both locally and using Docker.

## Online Editor

You can use the editor online at:
- [Open OB Editor](https://openobeditor.oballiance.org)

## Project Setup

To set up the project locally, follow these steps:

### Install Dependencies

```bash
npm install
```

### Compiles and Hot-reloads for Development

```bash
npm run serve
```

### Compiles and Minifies for Production

```bash
npm run build
```

### Run Your Tests

```bash
npm run test
```

### Lints and Fixes Files

```bash
npm run lint
```

### Customize Configuration

See the [Configuration Reference](https://cli.vuejs.org/config/).

## Docker Deployment

To run the OB Editor locally using Docker, follow these steps:

1. **Ensure Docker is Installed**: Make sure Docker is installed and running on your machine. You can download it from [Docker's official website](https://www.docker.com/products/docker-desktop).

2. **Build the Docker Image**: Navigate to the root directory of your project and run the following command to build the Docker image:

   ```bash
   docker-compose build
   ```

3. **Run the Docker Container**: Start the container using Docker Compose:

   ```bash
   docker-compose up
   ```

   - To run the container in detached mode (in the background), use:

     ```bash
     docker-compose up -d
     ```

4. **Access the Application**: Open a web browser and go to `http://localhost:9090` to access the OB Editor.

5. **Stop the Container**: To stop the running container, use:

   ```bash
   docker-compose down
   ```

6. **View Logs**: To view the logs of the running container, use:

   ```bash
   docker-compose logs
   ```

By following these steps, you can run the OB Editor locally using Docker. If you encounter any issues, please refer to the Docker documentation or seek further assistance.

---

This document is designed to help you quickly get started with the OB Editor, whether you're developing locally or deploying with Docker. For any additional questions or support, feel free to reach out to the project maintainers.