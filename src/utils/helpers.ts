export const isTokenExpired = (tok: string) => {
  return Date.now() >= JSON.parse(Buffer.from(tok.split('.')[1], 'base64').toString()).exp * 1000
}
