

const success = (res, { status = 200, message, data } = {}) => {
  const payload = { success: true }

  if (message) payload.message = message
  if (data !== undefined) payload.data = data

  return res.status(status).json(payload)
}

const fail = (res, { status = 400, message = 'Erro', errors } = {}) => {
  const payload = { success: false, message }
  if (errors !== undefined) payload.errors = errors
  return res.status(status).json(payload)
}

module.exports = { success, fail }

