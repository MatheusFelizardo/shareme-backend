# API

### Users
1. Create user - POST: /users 
```json
{
	"name": "Jessica",
	"lastName": "Rodrigues",
	"email": "jessica.felizardo@gmail.com",
	"password": "12345678",
	"role": "user"
}
```
2. Login - POST: /auth/login
```json
{
	"username": "matheus.felizardo@gmail.com",
	"password": "12345678"
}
```
3. Get users - GET: /users (authenticated)
4. Get user by id - GET: /users/{id} (authenticated)
5. Update user - PUT: /users/{id} (authenticated)
```json
{
	"name": "Matheus",
	"lastName": "Rodrigues"
}
```
6. Change role - PUT: /users/{id}/role (only allowed by admin role | authenticated)
```json
{
	"role": "admin"
}
```

7. Delete user - DELETE /users/{id}

### Folders
1. Create folder for the logged user - POST: /folders  (authenticated)
```json
{
	"name": "not_shared"
} 
```
2. Get all folders of the logged user - GET: /folders  (authenticated)
```json
{
	"name": "not_shared"
} 
```
3. Get all folders of the logged user that are shared - GET: /folders/shared  (authenticated)
4. Share folder - POST: /folders/{folderId}/share  (authenticated/need to be the folder owner)
```json
{
	"users": [
		{ "id": 3, "permission": "read" },
    { "id": 4, "permission": "edit" }
	]
} 
```
5. Update the given permission in the folder - PUT: /folders/share/update  (authenticated/need to be the folder owner)
```json
{
	"userId": 4, 
	"folderId": 1, 
	"permission": "read"
} 
```
6. Remove the given permission in the folder - DELETE: /folders/shared/remove  (authenticated/need to be the folder owner)
```json
{
	"userId": 3,
	"folderId": 2
} 
```

### Files
1. Upload file - POST: /files/upload?folder_id={id} (authenticated/need to be the folder owner or have permission to edit)

Multipart with "files" as key

![Untitled](images/Untitled%2010.png)
