@ -1,6 +1,6 @@
# ob-editor

## Use the editor at https://openobeditor.sunspec.org (legacy)
## Use the editor at https://openobeditor.oballiance.org

## Project setup
```
@ -29,3 +29,43 @@ npm run lint

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## Docker Deployment

To run the OB Editor locally using Docker, follow these steps:

1. **Ensure Docker is installed**: Make sure Docker is installed and running on your machine. You can download it from [Docker's official website](https://www.docker.com/products/docker-desktop).

2. **Build the Docker image**: Navigate to the root directory of your project and run the following command to build the Docker image:

   ```bash
   docker-compose build
   ```

3. **Run the Docker container**: Start the container using Docker Compose:

   ```bash
   docker-compose up
   ```

   - To run the container in detached mode (in the background), use:

     ```bash
     docker-compose up -d
     ```

4. **Access the application**: Open a web browser and go to `http://localhost:9090` to access the OB Editor.

5. **Stop the container**: To stop the running container, use:

   ```bash
   docker-compose down
   ```

6. **View logs**: To view the logs of the running container, use:

   ```bash
   docker-compose logs
   ```

By following these steps, you can run the OB Editor locally using Docker. If you encounter any issues, please refer to the Docker documentation or seek further assistance.