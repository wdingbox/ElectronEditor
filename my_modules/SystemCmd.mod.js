// This is shared by client and server site.



const exec = require('child_process').exec;

var SystemCmd = {
    run_git_cmd: async function (command, res) {
        return new Promise(async (resolve, reject) => {
            try {
                //command = "ls"
                console.log('cmd:', command)
                exec(command, (err, stdout, stderr) => {
                    if (err) {
                        //some err occurred
                        console.error(err);
                        reject(err);
                    } else {
                        // the *entire* stdout and stderr (buffered)
                        console.log('cmd output ', stdout)
                        resolve(stdout);
                    }
                });
            } catch (err) {
                console.log(err)
            }
        })
    },
    child_sshR: null,
    start: function (prxInfo, cbfunc) {
        if (!prxInfo.port || !prxInfo.prxy) return console.log("*** FATEL ERROR on prxy:", prxInfo)
        //tunnelling sample cmd: 
        //ssh -R 9998:localhost:8001  ubuntu@ec2-54-146-65-28.compute-1.amazonaws.com -i "ElectronTest.pem"
        var cmd = `ssh -R ${prxInfo.port}:localhost:8001 ${prxInfo.prxy} -i "${prxInfo.fpem}" -o "StrictHostKeyChecking no"`;
        console.log(`* cmd= ${cmd}`);
        if (this.child_sshR) {
            this.child_sshR.kill("SIGINT"); // kill the previous old tunnelling.
        }
        this.child_sshR = exec(cmd, (error, stdout, stderr) => {
            console.log(`* cmd> ${cmd}\nerrr=${error}, \nstdout=\n${stdout} \nstderr=${stderr}\n`);
            if (cbfunc) {
                cbfunc(stdout)
            }
        });
        this.check_stats()
    },
    stop: function () {
        if (this.child_sshR) {
            this.child_sshR.kill("SIGINT"); // kill the previous old tunnelling.
            this.child_sshR = null
            this.check_stats()
        }
    },
    check_stats: function (cbf) {
        //debug
        var cmd = "ps aux | grep ssh"
        console.log(`* cmd= ${cmd}`);
        exec(cmd, (error, stdout, stderr) => {
            console.log(`* cmd> ${cmd}\nerrr=${error}, \nstdout=\n${stdout} \nstderr=${stderr}\n`);
            if (cbf) {
                cbf(stdout)
            }
        });
    }
}

module.exports = {
    //For Client site.
    SystemCmd: SystemCmd,

}
