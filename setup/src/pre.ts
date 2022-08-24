import {exec} from '@actions/exec';
import {get} from 'https';
import {createWriteStream} from 'fs';

(async () => {
    const url = "https://temp-bin.s3.us-east-1.amazonaws.com/sprkl?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEEAaCWV1LXdlc3QtMyJGMEQCIAOPIhQcKoPtds55YuTktY0IXG2YzYnppxrSJx4pZyqtAiAvRNzdjmkX7JY8T5sm%2FEa1YSkIAPcnx7TiBwymZdSuQyqEAwi5%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAAaDDQyMTMyMjgwNzIwOCIMA5AUWZ%2FgaeffUA0cKtgC4Za4cbsJdm8FeBWSozyxP1R0GaZtRknQBKeCsDIjHay5t8IXolzhtgP7UNQ9%2Bo9GfMBdPmgmJfEzQdlX6u53%2BQvD59YHnfB%2B3JyfH9uwjFIJSBb5fE%2BMpHz8BDDrFK3ASVWXqO795Bmvs6TH1Jh%2BIY9ewBCEMTYuEcTgkVJxePueIavpl3ftvy1ZoDsllVv8k4vMJjBYMQo0H1sc1PTwSSfmmMHkbK8NAuJwK%2FoMfGkmg8r%2BdP6vHVJY7XeOULbuPNdIq9cI2qqPc3Cu9%2FgW29utn6mn%2Fpr%2BGTKsU8yXmJX26U%2F0CLcK%2FQJ4O9eRYWv2rAjRFB8HTNQAvq5cxelcPQrJgGq6T9GLdPQLfz4plzXJ2SLmqpzC8d%2B%2BAc5g%2BhNh9I%2BMV5kThoVIPgulx8ztQNpu281XEL%2BJCcigfS%2B7Q9d9qYouW1IHfbrVKaKo5yI3VN1LKEg7Scowr9mcmAY6tAIs2eQTeM4N4VWamHrxTdHiMnEOU%2B%2BUbRIon2oxuCwIAfbe2KfQpgbtEWSVjGEPyN4cLWtJvQRINlo6E%2FmET%2FqLmiwgO5RWuc%2FpuGUOL%2ByyjLECEE8UdazAlb4grXqbHpQ94zoJy7w5NLKFrSS30anNUKdTTdcgvUOAZ%2Bce3bIQR%2B5OEVs1Szo7mfoyPgoGdM6%2BczpVUuK2jS6KN%2BSyyS6PpsdhM1ah%2BQWuf7zCYhKL7%2BzsjIYkVtsSt9iXoBHxLzexIKPpJFzgcNB18TwQVE6be3mXrJRgao7zjRz2dF7uPan6WCB32QIUzPpqDFMhuKXFSxgkBOXUfNQvHn7HlPi65%2FPDAeFT987qVU3EnCQShVfhiUuwkSo4Ejf3hFSmkm%2FMaegIAxaA8wMipqAlu%2BIZnHRFBA%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220825T120453Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIAWEGGL26UCT5GYS7X%2F20220825%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=df20d3e433dc7fe0d4d93dc43662298726d655d3d4c08ef2ee2a1c1e9d8b9558"
    const file = createWriteStream("/tmp/sprkl-copy", {flags: 'w+', mode: 775});
    get(url, response => response.pipe(file));

   // after download completed close filestream
   file.on("finish", () => {
       file.close();
       console.log("Download Completed");
   });

    await exec('chmod +x /tmp/sprkl-copy')
})();
