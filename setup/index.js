const {get} = require('https');
const {createWriteStream} = require('fs');

async function downloadSprkl() {
    const url ="https://temp-bin.s3.us-east-1.amazonaws.com/sprkl?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECoaCWV1LXdlc3QtMyJIMEYCIQCbhFIuNwhOUK%2BAk%2B4ob%2BwheGBJ7rIQkVu1JPd%2FqL6oXAIhAPRXVSdqRzGoBLr0AT%2FETGXaS95kym7BWqUwkGr0pwDNKoQDCKL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNDIxMzIyODA3MjA4IgzIZwrB6iU2R2tjvw4q2ALJH4LiR%2BLb9q2iPiBXcosSANEnU8B9FQdxdTWNZhfIFLL6o%2BPVzF5y%2BWKpnRQzFbwIqF7cr0cBfrNj1ULfTWm6MliBavqcOGYxEOA6HLknqZC0LuWQtUWmhy3sbo%2FrAT7JIchNbDm1CtKTTV3D7l6LXfqCBil7iOOaujYigMsoMfpN9O1mRyGWsWR5GxNRqTf2lMTMBogLJvr91wNfzIZc9ac%2FIibO3gtGiGMQGEfa74X26QN%2Fow8X1BDL9staXRrr2oxvxUvUrSiU5xPlQP0LmwWQbtGV9RoQRXJa2ShK5MAaZw8E1D7hw4sWJiAMZm9s%2FAHj6t%2BytYCb7rvxSjRbA70RhBxa2iov7KgnmE1olgYQWFmZwJ1pLfZzgoVyXWz9bdCE1uSOXZOA0sH1LvWYWnbeV7PaERhnOzt6HeyUs0Q6OMjJ3J9o3lICA%2FI2nG3GY1JrOT0epDDK2JeYBjqyApMgPq8Qma7pw7%2FF1O3zjx4KjJWeML7NgXGv%2Fmdd2TyOAHZa67DsB3hpocydwySKip6LYl8V6nLiMaUyfWyztVpNwYmDOCeJumbhZOjL7hd6kveTRosFRE%2F4BdexFXILKKuLccGYi%2BfpVM16OEjGLMkbbuNN9zLFzYIecK0PSvIEsavlnSQBzJN%2BPwJ4sLVeeV2rtjYLa7RPndiBF1K3Nabzp6yZCAYuPTLfa2tLIxkywf7hIUnQdLvO2CZ6Ket7YKo0ZzGFipYpUhUa%2FWmymDv5v2YYvkjPqI251MXPo3A8w2BnrGXg7CORF3YCKHW4oMFxXS2sqn%2FMbawga60sATDhiV6y24gJFh2M3G5T4D7erTWgGh4%2BtflSvXWu1zT6RG%2BgUaHtMzPiPPAjVyjs4SDJFQ%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220824T154600Z&X-Amz-SignedHeaders=host&X-Amz-Expires=3600&X-Amz-Credential=ASIAWEGGL26UADQR72F6%2F20220824%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=9eef3ad9f1317b2c408c13fec7e86f2cde9dad1511533e7c2a92f65b05b23334";

    const file = createWriteStream("/tmp/sprkl-copy");
    const request = get(url, response => response.pipe(file));

   // after download completed close filestream
   file.on("finish", () => {
       file.close();
       console.log("Download Completed");
   });
};

async function hello() {
	console.log('Start');
	await downloadSprkl();
	console.log('End');
}

hello();
