import type { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
    const status = error.statusCode || 500
    console.log(error)
  
    const { message } = error
    const { data } = error
    res.status(status).json({ message, data })
    next()
  };

  export default errorHandler