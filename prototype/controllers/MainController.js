const request = require('request');
require('dotenv').config();

const getAccessToken = function () {

    return new Promise(function (resolve, reject) {

        const url = 'https://login.microsoftonline.com/common/oauth2/token';

        const username = process.env.PBIPROUSERNAME; // Username of PowerBI "pro" account - stored in config
        const password = process.env.PBIPROPASSWORD; // Password of PowerBI "pro" account - stored in config
        const clientId = process.env.PBIAPPID; // Applicaton ID of app registered via Azure Active Directory - stored in config

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        const formData = {
            grant_type: 'password',
            client_id: clientId,
            resource: 'https://analysis.windows.net/powerbi/api',
            scope: 'openid',
            username: username,
            password: password
        };

        request.post({
            url: url,
            form: formData,
            headers: headers
        }, function (err, result, body) {
            if (err) return reject(err);
            const bodyObj = JSON.parse(body);
            resolve(bodyObj.access_token);
        });
    });
};

const getReportEmbedToken = function (accessToken, groupId, reportId) {

    return new Promise(function (resolve, reject) {

        const url = 'https://api.powerbi.com/v1.0/myorg/groups/' + groupId + '/reports/' + reportId + '/GenerateToken';

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + accessToken
        };

        const formData = {
            'accessLevel': 'view',
            "identities": [
                {
                    "username": "Lindseys",
                    //"username": "Fashions Direct",
                    "roles": [ "pbiembed", "roles" ],
                    "datasets": [ "2767aa7e-7b26-4ca0-917d-e586d7c4146d"]
                }
            ]
        };

        request.post({
            url: url,
            form: formData,
            headers: headers

        }, function (err, result, body) {
            if (err) return reject(err);
            const bodyObj = JSON.parse(body);
            resolve(bodyObj.token);
        });
    });
};


module.exports = {
    embedReport: function (req, res) {
        getAccessToken().then(function (accessToken) {
            getReportEmbedToken(accessToken, req.params.groupId, req.params.reportId).then(function (embedToken) {
                console.log("Rendering report...");
                console.log("Dashboard Id: " + req.params.dashboardId);
                console.log("Report Id: " + req.params.reportId);
                console.log("Group Id: " + req.params.groupId);
                res.render('pages/report', {
                    reportId: req.params.dashboardId,
                    embedToken,
                    embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=' + req.params.reportId + '&groupId=' + req.params.groupId
                });
            }).catch(function (err) {
                res.send(500, err);
            });
        }).catch(function (err) {
            res.send(500, err);
        });
    }
};