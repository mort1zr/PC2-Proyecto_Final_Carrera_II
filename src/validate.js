/** Valida req.body con un esquema zod; responde 400 con el detalle si falla. */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: 'Datos inválidos', details });
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { validate };
