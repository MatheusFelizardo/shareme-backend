## Decisions

1. **Create real folders x virtual path + store only files**
We choose to store the virtual path for folders and only store the files. The front end will be responsible for showing the “folder-like” structure. This way we can scale and migrate easily if necessary.
When a user creates an account it is created inside the storage a folder with his username (which is unique), and all the files his uploads are created into his storage.
2. **Interaction via terminal**
We choose to create a simple library that allows the user to manipulate the folders and files using commands via the terminal. 
The commands are based on UNIX, this way the user can use his previous knowledge to manipulate the folders/files.
3. **DDOS attack prevention in backend**
Implementend <a href="https://docs.nestjs.com/security/rate-limiting" target="_blank">this guard for rate limiting<a/> for security reasons and help to prevent DDOS attack. 
We can also implement cache and more protections in the server after deploy the project.