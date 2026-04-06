import delay from 'lodash/delay.js'

export function greet(name) {
  return new Promise((resolve) => {
    delay(() => {
      resolve(`Hello, ${name}! This is from shared package.`)
    }, 500)
  })
}
