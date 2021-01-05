const blstick = require("blinkstick")
const http = require("http")

const addZeroIfNecessary = str => str.length < 2 ? `0${str}` : str

const leds = blstick.findFirst()

const exitGracefully = () => {
  for (let i = 0; i < 8; i++) {
    leds.setColor(0, 0, 0, { index: i })
  }
  process.exit(0)
}

process.on("SIGINT", exitGracefully)
process.on("SIGTERM", exitGracefully)

const setColor = color => {
  for (let i = 0; i < 8; i++) {
    leds.morph(color, { index: i })
  }
}

const perc2color = percentage => {
  let colorStr
  if (percentage < 50) {
    const red = addZeroIfNecessary(Math.floor((percentage / 50) * 255).toString(16))
    colorStr = `#${red}FF00`
  } else {
    const green = addZeroIfNecessary(Math.floor(((100 - percentage) / 50) * 255).toString(16))
    colorStr = `#FF${green}00`
  }

  return colorStr
}

const get = () => new Promise((resolve, reject) => {
  http.get("http://192.168.178.21:8080", { timeout: 500 }, res => {
    let rawData = ""

    res.on("data", chunk => rawData += chunk)

    res.on("end", () => {
      resolve(rawData)
    })
  }).on("error", () => {
    reject()
  }).on("timeout", () => {
		reject()
	})
})


const sum = arr => arr.reduce((prev, curr) => prev + curr, 0)

const formatCPUInfo = cpuInfo => {
  /*
    cpuInfo format from server:
      <temp>C <percentage>%\n
      <temp>C <percentage>%\n
      <temp>C <percentage>%\n
      <temp>C <percentage>%
  */
  const newInfos = cpuInfo.split("\n")
    .map(str => str.split(" ")[1])
    .map(str => str.replace("%", ""))
    .map(n => +n)

  const average = sum(newInfos) / 4

  setColor(perc2color(average))
}

const sleep = timeout => new Promise(resolve => {
  setTimeout(() => {
    resolve()
  }, timeout)
})

const loop = async () => {
  while (true) {
    try {
      const data = await get()
      formatCPUInfo(data)
    } catch (_) {
      const rred = addZeroIfNecessary(Math.floor(Math.random() * 255).toString(16))
      const rgreen = addZeroIfNecessary(Math.floor(Math.random() * 255).toString(16))
      const rblue = addZeroIfNecessary(Math.floor(Math.random() * 255).toString(16))

      const randomColor = `#${rred + rgreen + rblue}`

      setColor(randomColor)
    }

    await sleep(1000)
  }
}

loop()
