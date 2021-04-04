const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  request.user = user;
  return next();
}

function checkExistingUserTodo(request, response, next) {
  const { id } = request.params;

  const todo = request.user.todos.find(todo => todo.id === id);

  if (!todo) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  request.todo = todo;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const hasUser = users.some(user => user.username === username);

  if (hasUser) {
    return response.status(400).json({ error: 'Username already in use' });
  }

  const newUser = { 
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(newUser);

  return response.status(201).send(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  return response.status(200).send(request.user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTodo = { 
    id: uuidv4(),
    title,
    done: false, 
    deadline,
    created_at: new Date(),
  };

  user.todos.push(newTodo);

  return response.status(201).send(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checkExistingUserTodo, (request, response) => {
  const { todo } = request;
  const { title, deadline } = request.body;

  todo.title = title;
  todo.deadline = deadline;

  return response.status(200).send(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistingUserTodo, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.status(200).send(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistingUserTodo, (request, response) => {
  const { id } = request.params;
  const { todos } = request.user;

  todos.splice(todos.findIndex(todo => todo.id === id), 1);

  return response.status(204).json();
});

module.exports = app;