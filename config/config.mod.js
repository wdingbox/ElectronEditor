
const MASTER_SVR = {
    hostname: 'ec2-54-236-26-26.compute-1.amazonaws.com',  // 'ec2-54-146-65-28.compute-1.amazonaws.com',
    ip: '54.236.26.26',
    https: { port: 3001 },
    http: { port: 3000 },
    root: "ubuntu",
}



// cp from RestApi at svr site.
const SVR_API = {
    // in both master and slave
    pull_userData_by_email: "/pull_userData_by_email", //for graphic
    push_userData_by_email: "/dynamoDb_push",//test only

    MASTER_ONLY: {
        balanced_slave_svr: "/balanced_slave_info",
    },
    SLAVE_SVC: {
        get_http_proxy_info: "/get_http_proxy_info"
    }
}


const APP_VERSIONS = [
    { v: "2.6.0", d: '20-09-11', s: 'change rest api to pull_userData_by_email' },
    { v: "2.5.0", d: '20-09-08', s: 'aws slave instance auto creation for users scaling, better log and org' },
    { v: "2.0.0", d: '20-09-01', s: 'aws slaver mgmt' },
    { v: "1.0.1", d: '20-09-01', s: 'work without slaver mgmnt' }
]

module.exports = {
    //For Client site.
    MASTER_SVR: MASTER_SVR,

    SVR_API: SVR_API,
    APP_VERSIONS: APP_VERSIONS
}
