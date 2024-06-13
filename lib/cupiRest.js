const convert = require("xml-js");

module.exports = {
  getRequest: function (server, username, password, uri) {
    let headers = new Headers();
    headers.set("Authorization", "Basic " + Buffer.from(username + ":" + password).toString("base64"));
    var formattedUrl = new URL(uri, `https://${server}`).href;
    return fetch(formattedUrl, {
      method: "GET",
      headers: headers,
    })
      .then(async (response) => {
        const isXml = response.headers.get("content-type")?.includes("application/xml;charset=UTF-8");
        const isAudio = response.headers.get("content-type")?.includes("audio/wav;charset=UTF-8");
        const data = isXml ? await response.text() : null;
        const json = isXml ? convert.xml2json(data, { compact: true, spaces: 4}) : null;
  
        if(response.ok){
          if (isXml) {
            return JSON.parse(json);
          }
          if (isAudio) {
            const buffer = await response.arrayBuffer();
            return buffer;
          } else {
            new Error("Invalid content type");
          }
        }else{
          return Promise.reject(JSON.parse(json));
        }
      })
      .catch((error) => {
        return error;
      });
  },
  putRequest: function (server, username, password, uri, contentType, data) {
    let headers = new Headers();
    headers.set("Authorization", "Basic " + Buffer.from(username + ":" + password).toString("base64"));
    headers.set("Content-Type", contentType);
    headers.set("Accept", "application/json");
    var formattedUrl = new URL(uri, `https://${server}`).href;
    return fetch(formattedUrl, {
      method: "PUT",
      headers: headers,
      body: data
    })
      .then(async (response) => {
        const isXml = response.headers.get("content-type")?.includes("application/xml;charset=UTF-8");
        const isAudio = response.headers.get("content-type")?.includes("audio/wav;charset=UTF-8");
        const isJson = response.headers.get("content-type")?.includes("application/json;charset=UTF-8");
        const data = isXml ? await response.text() : null;
        const json = isXml ? convert.xml2json(data, { compact: true, spaces: 4}) : response.status;
  
        if(response.ok){
          if (isXml) {
            return JSON.parse(json);
          }else if (isAudio) {
            const buffer = await response.arrayBuffer();
            return buffer;
          }else if (isJson) {
            if(response.status === 204){
              let output = {
                status: response.status,
                message: "PUT request successful. No content returned."
              };
              return output;
            }else{
              return response.json();
            }
          } else {
            new Error("Invalid content type");
          }
        }else{
          return Promise.reject(JSON.parse(json));
        }
      })
      .catch((error) => {
        return error;
      });
  },
};
