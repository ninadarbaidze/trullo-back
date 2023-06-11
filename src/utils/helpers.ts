export const isTokenExpired = (tok: string) => {
  return Date.now() >= JSON.parse(Buffer.from(tok.split('.')[1], 'base64').toString()).exp * 1000
}


export function exclude<User, Key extends keyof User>(
  user: User,
  keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key]
  }
  return user
}

