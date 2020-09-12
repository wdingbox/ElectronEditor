
/// forgot password: https://www.youtube.com/watch?v=_MO7uv0fSm4

/// https://blog.jsecademy.com/how-to-authenticate-users-with-tokens-using-cognito/




$(function () {
    ui_uti.store_login = store_auto_launch //defined in nodeIntegration.js

    $(".fe-eye").click(function () {
        var str = $(this).parent().parent().prev().attr("type")
        if (str === "password") {
            str = "text"
        } else {
            str = "password"
        }
        $(this).parent().parent().prev().attr("type", str)
        console.log("click")
    });

});



function load_store() {

}


var ui_uti = {
    //store: null,
    display: function (str, colr) {
        document.getElementById("titleheader").innerHTML = `<b style="color: ${colr};">${str}</b>`
    },
    load_store: function () {
        var authenticationData = ui_uti.store_login.get("authenticationData")
        console.log("authenticationData=", authenticationData)
        if (authenticationData) {
            document.getElementById("uuname").value = authenticationData.Username;
            document.getElementById("password").value = authenticationData.Password;
        }
    },
    clear_store: function () {
        console.log("clear stored data.")
        ui_uti.display("clear stored data permanently.", "black")
        authenticationData = { Username: "", Password: "" };
        ui_uti.store_login.set("authenticationData", null)

        document.getElementById("uuname").value = "";
        document.getElementById("password").value = "";
    },
    save_store: function (authenticationData) {
        if (!authenticationData) {
            return
        }
        if (authenticationData.Username.trim().length > 0) {
            ui_uti.store_login.set("authenticationData", authenticationData)
            console.log("store", authenticationData)
        } else {
            ui_uti.display("email is empty", "red")
        }
    }
}


function signIn(cbf) {

    ui_uti.display("Start to sign in...")


    var email = document.getElementById("uuname").value
    var pword = document.getElementById("password").value

    var authenticationData = {
        Username: email,
        Password: pword,
    };

    ui_uti.save_store(authenticationData)


    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

    var poolData = {
        UserPoolId: _config.cognito.userPoolId, // Your user pool id here
        ClientId: _config.cognito.clientId, // Your client id here
    };

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var userData = {
        Username: document.getElementById("uuname").value,
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            var accessToken = result.getAccessToken().getJwtToken();

            console.log("token data:", result)
            console.log(accessToken);

            const tokens = {
                accessToken: result.getAccessToken().getJwtToken(),
                idToken: result.getIdToken().getJwtToken(),
                refreshToken: result.getRefreshToken().getToken()
            };
            ui_uti.store_login.set("tokens", tokens) //authenticate users with Tokens. https://blog.jsecademy.com/how-to-authenticate-users-with-tokens-using-cognito/


            ui_uti.display("Success", "green")

            //////////////////////////
            if(cbf){
                cbf(email, result)
            }else{
                setTimeout(function () {
                    //window.open("settings_session.html");
                    window.location.href = "settings_session.html"
                }, 3000)
            }
            //////////////////////////
        },

        onFailure: function (err) {
            //alert(err.message || JSON.stringify(err));
            console.error("AWS ERR:", err)
            ui_uti.display(err.message, "red")
        },
    });
}




function forgotpasswordbutton___() {
    var poolData = {
        UserPoolId: _config.cognito.userPoolId, // Your user pool id here
        ClientId: _config.cognito.clientId, // Your client id here
    };

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var username = document.getElementById("uuname").value

    var userData = {
        Username: username,
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.forgotPassword({
        onSuccess: function (result) {
            console.log('call result: ' + result);
            ui_uti.display(result + username, "red")
        },
        onFailure: function (err) {
            alert(err);
            console.log(err);
            ui_uti.display(JSON.stringify(err), "red")
        },
        inputVerificationCode(ret) {
            console.log("inputVerificationCode:", ret)
            ui_uti.display(`Please get code from email:: ${ret.CodeDeliveryDetails.Destination}`)
            //var verificationCode = prompt('Please input verification code ', '');
            //var newPassword = prompt('Enter new password ', '');
            //cognitoUser.confirmPassword(verificationCode, newPassword, this);
            setTimeout(function () {
                //window.open("settings_session.html");
                window.location.href = "sign-in_forgot-password.html"
            }, 3000)
        }
    });
}






function registerButton() {
    //personalnamename =  document.getElementById("personalnameRegister").value;	
    var username = document.getElementById("uuname").value;

    // if (document.getElementById("password").value != document.getElementById("confirmationpassword").value) {
    //     alert("Passwords Do Not Match!")
    //     throw "Passwords Do Not Match!"
    // } else {
    var password = document.getElementById("password").value;
    //}

    var poolData = {
        UserPoolId: _config.cognito.userPoolId, // Your user pool id here
        ClientId: _config.cognito.clientId // Your client id here
    };
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var attributeList = [];

    var dataEmail = {
        Name: 'email',
        Value: username, //get from form field
    };

    // var dataPersonalName = {
    // 	Name : 'name', 
    // 	Value : personalname, //get from form field
    // };

    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    //var attributePersonalName = new AmazonCognitoIdentity.CognitoUserAttribute(dataPersonalName);


    attributeList.push(attributeEmail);
    //attributeList.push(attributePersonalName);

    userPool.signUp(username, password, attributeList, null, function (err, result) {
        if (err) {
            console.log(err.message || JSON.stringify(err));
            ui_uti.display(err.message, "red");
            return;
        }
        cognitoUser = result.user;
        console.log('user name is ' + cognitoUser.getUsername());
        //change elements of page
        ui_uti.display("Check your email for a verification link", "green");
        ui_uti.save_store({ Username: username, Password: password })

    });
}






///////

function forgotpasswordbutton() {
    var poolData = {
        UserPoolId: _config.cognito.userPoolId, // Your user pool id here
        ClientId: _config.cognito.clientId, // Your client id here
    };

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var username = document.getElementById("uuname").value

    var userData = {
        Username: username,
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.forgotPassword({
        onSuccess: function (result) {
            console.log('call result: ' + result);
            ui_uti.display(result + username, "red")
        },
        onFailure: function (err) {
            alert(err);
            console.log(err);
            ui_uti.display(JSON.stringify(err), "red")
        },
        inputVerificationCode(ret) {
            console.log("inputVerificationCode:", ret)
            ui_uti.display(`A code is sent to your email.`, "green");//:: ${ret.CodeDeliveryDetails.Destination}`)
            //var verificationCode = prompt('Please input verification code ', '');
            //var newPassword = prompt('Enter new password ', '');
            //cognitoUser.confirmPassword(verificationCode, newPassword, this);
        }
    });
}




function reset_password() {
    var poolData = {
        UserPoolId: _config.cognito.userPoolId, // Your user pool id here
        ClientId: _config.cognito.clientId, // Your client id here
    };

    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    var username = document.getElementById("uuname").value

    var userData = {
        Username: username,
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);  //https://stackoverflow.com/questions/38110615/how-to-allow-my-user-to-reset-their-password-on-cognito-user-pools

    var passcode = document.getElementById("passcode").value
    var password = document.getElementById("password").value

    if (!passcode) {
        return ui_uti.display("code is empty", "red");
    }
    if (!password) {
        return ui_uti.display("password is empty", "red");
    }

    cognitoUser.confirmPassword(passcode, password, {
        onFailure(err) {
            console.log(err);
            ui_uti.display(err.message, "red")
        },
        onSuccess() {
            console.log("Success");
            ui_uti.display("Success", "green")
        },
    });

}



var aws_cognito_uti = {
    email_value: "",
    m_cognitoUser: null,
    init: function (cbfunc) {
        let _THIS = this
        var data = {
            UserPoolId: _config.cognito.userPoolId,
            ClientId: _config.cognito.clientId
        };
        var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
        var cognitoUser = userPool.getCurrentUser();
        m_cognitoUser = cognitoUser;

        ////
        if (cognitoUser != null) {
            cognitoUser.getSession(function (err, session) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('session validity: ' + session.isValid());
                //Set the profile info
                cognitoUser.getUserAttributes(function (err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    console.log(result);
                    _THIS.email_value = result[2].getValue();
                    //document.getElementById("email_value").innerHTML = result[2].getValue();
                    if (cbfunc) {
                        cbfunc(_THIS.email_value)
                    }
                });

            });
        }
    },
    signOut: function () {
        this.init()
        if (this.m_cognitoUser != null) {
            this.m_cognitoUser.signOut();
        }
    }
}