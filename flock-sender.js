"use strict";

// Exports
module.exports = { sendToFlock };

// Dependency
const request = require("request");
const os = require("os");


/**
 * Sends immediately the message(s) to Flock's Incoming Webhook.
 *
 * @param {Message[]) messages - List of messages, ready to send.
 *                              This list can be trimmed and concated base on module configuration.
 */
function sendToFlock(messages, config) {
  // If a Flock URL is not set, we do not want to continue and nofify the user that it needs to be set
  if (!config.flock_url) {
    return console.error(
      "There is no Flock URL set, please set the Flock URL: 'pm2 set pm2-flock:flock_url https://flock_url'"
    );
  }

  let limitedCountOfMessages;
  if (config.queue_max > 0) {
    // Limit count of messages for sending
    limitedCountOfMessages = messages.splice(
      0,
      Math.min(config.queue_max, messages.length)
    );
  } else {
    // Select all messages for sending
    limitedCountOfMessages = messages;
  }

  // The JSON payload to send to the Webhook
  let payload = {
    username: config.username || config.servername || os.hostname(),
    attachments: [],
  };

  // Merge together all messages from same process and with same event
  // Convert messages to Flock message's attachments
  payload.attachments = convertMessagesToFlockAttachments(
    mergeSimilarMessages(limitedCountOfMessages)
  );

  // Because Flock`s notification text displays the fallback text of first attachment only,
  // add list of message types to better overview about complex message in mobile notifications.

  if (payload.attachments.length > 1) {
    payload.text = payload.attachments
      .map(function (/*FlockAttachment*/ attachment) {
        return attachment.title;
      })
      .join(", ");
  }

  // Group together all messages with same title.
  // payload.attachments = groupSameFlockAttachmentTypes(payload.attachments);

  // Add warning, if some messages has been suppresed
  if (messages.length > 0) {
    let text =
      "Next " +
      messages.length +
      " message" +
      (messages.length > 1 ? "s have " : " has ") +
      "been suppressed.";
    payload.attachments.push({
      title: "message rate limitation",
      text: text,
      ts: Math.floor(Date.now() / 1000),
    });
  }

  // Options for the post request
  const requestOptions = {
    method: "post",
    body: payload,
    json: true,
    url: config.flock_url,
  };

  // Finally, make the post request to the Flock Incoming Webhook
  request(requestOptions, function (err, res, body) {
    if (err) return console.error(err);
    if (body !== "ok") {
      console.error(
        "Error sending notification to Flock, verify that the Flock URL for incoming webhooks is correct. " +
          messages.length +
          " unsended message(s) lost."
      );
    }
  });
}

/**
 * Merge together all messages from same process and with same event
 *
 * @param {Messages[]} messages
 * @returns {Messages[]}
 */
function mergeSimilarMessages(messages) {
  return messages.reduce(function (
    /*Message[]*/ finalMessages,
    /*Message*/ currentMessage
  ) {
    if (
      finalMessages.length > 0 &&
      finalMessages[finalMessages.length - 1].name === currentMessage.name &&
      finalMessages[finalMessages.length - 1].event === currentMessage.event
    ) {
      // Current message has same title as previous one. Concate it.
      finalMessages[finalMessages.length - 1].description +=
        "\n" + currentMessage.description;
    } else {
      // Current message is different than previous one.
      finalMessages.push(currentMessage);
    }
    return finalMessages;
  },
  []);
}

/**
 * Converts messages to json format, that can be sent as Flock message's attachments.
 *
 * @param {Message[]) messages
 * @returns {FlockAttachment[]}
 */
function convertMessagesToFlockAttachments(messages) {
  return messages.reduce(function (flockAttachments, message) {
    

    var title = `${message.name} ${message.event}`;
    var description = (message.description || "").trim();
    var fallbackText =
      title + (description ? ": " + description.replace(/[\r\n]+/g, ", ") : "");
    flockAttachments.push({
      fallback: escapeFlockText(fallbackText),
      title: escapeFlockText(title),
      text: escapeFlockText(description),
      ts: message.timestamp,
    });

    return flockAttachments;
  }, []);
}

/**

 * @param {string} text
 * @returns {string}
 */
function escapeFlockText(text) {
  return (text || "")
    .replace("&", "&amp;")
    .replace("<", "&lt;")
    .replace(">", "&gt;");
}

/**
 * @typedef {Object} FlockAttachment
 *
 * @property {string} [text]
 * @property {number} ts - Linux timestamp format
 */
