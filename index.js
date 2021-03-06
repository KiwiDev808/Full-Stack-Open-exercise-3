require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

app.use(cors())
app.use(express.json())
app.use(express.static('build'))

morgan.token('body', (req, res) => {
  return JSON.stringify(req.body)
})

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
)

app.get('/info', (request, response) => {
  Person.countDocuments({}, (err, count) => {
    const phoneBookEntries = `Phonebook has info for ${count} people`
    response.send(`<p>${phoneBookEntries}</p> <p>${new Date()}</p>`)
  })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((person) => {
    response.json(person)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => {
      next(error)
    })
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then((result) => {
      response.status(204).end()
    })
    .catch((error) => {
      next(error)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body
  const newPerson = {
    number: body.number,
  }
  Person.findOne({ name: body.name })
    .then((person) => {
      if (person) {
        const opts = { runValidators: true, new: true }
        Person.findByIdAndUpdate(person.id, newPerson, opts)
          .then((updatedPerson) => {
            response.json(updatedPerson)
          })
          .catch((error) => {
            next(error)
          })
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => {
      next(error)
    })
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || body.number.length === 0) {
    return response.status(400).json({
      error: 'name or number is missing',
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson)
    })
    .catch((error) => {
      next(error)
    })
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ message: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(409).send({ message: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
