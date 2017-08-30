#!/usr/bin/env node
const exec = require('child_process').exec
const ora = require('ora')
const path = require('path')
const fs = require('fs')
const spawn = require('cross-spawn-promise')

const cwd = process.cwd().replace(/\\/g, '/')
const suffix = '/node_modules/preact-cli-plugin-flow'
const root = cwd.endsWith(suffix)
    ? cwd.substr(0, cwd.length - suffix.length)
    : cwd
const spinner = ora('Loading unicorns').start()
const srcPath = path.join(cwd, '.flowconfig')
const dstPath = path.join(root, '.flowconfig')
const flowConfig = fs.readFileSync(srcPath)
const yarnLock = path.join(root, 'yarn.lock')
const { isYarn } = require('nyr')

const install = async (yarn, cwd, packages, env) => {
    let isDev = env === 'dev' ? true : false
    let isYarnAvailable = fs.existsSync(yarnLock) || isYarn
    let toInstall = packages.filter(Boolean)

    // pass null to use yarn only if yarn.lock is present
    if (!yarn) {
        try {
            let stat = await fs.stat(path.resolve(cwd, 'yarn.lock'))
            yarn = stat.isFile()
        } catch (e) {
            yarn = false
        }
    }

    if (isYarnAvailable && yarn) {
        let args = ['add']
        if (isDev) {
            args.push('-D')
        }

        return await spawn('yarn', [...args, ...toInstall], {
            cwd,
            stdio: 'ignore'
        })
    }

    await spawn(
        'npm',
        ['install', isDev ? '--save-dev' : '--save', ...toInstall],
        { cwd, stdio: 'ignore' }
    )
}

const installFlowBin = async () => {
    spinner.start('Installing Dependencies')
    await install(isYarn, root, ['flow-bin'], 'dev')
    spinner.succeed('Dependencies installed')
}

spinner.start('Flow is scaffolding')
fs.writeFile(dstPath, flowConfig, function(error) {
    if (error) {
        spinner.fail(`Error init: ${error}`)
        return
    }
    spinner.succeed('Scaffolding Done')
    installFlowBin()
})
