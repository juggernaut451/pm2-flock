# pm2-flock

### Inspired by [pm2-slack](https://github.com/mattpker/pm2-slack)


# pm2-flock

This is a PM2 Module for sending events & logs from your PM2 processes to Flock.

## Install

To install and setup pm2-flock, run the following commands:

```
pm2 install pm2-flock
pm2 set pm2-flock:flock_url https://flock_url
```

To get the Flock URL, you need to setup an Incoming Webhook. More details on how to set this up can be found here: https://api.flock.com/incoming-webhooks

## Events subscription configuration

The following events can be subscribed to:

- `log` - All standard out logs from your processes. Default: false
- `error` - All error logs from your processes. Default: true
- `kill` - Event fired when PM2 is killed. Default: true
- `exception` - Any exceptions from your processes. Default: true
- `restart` - Event fired when a process is restarted. Default: false
- `reload` - Event fired when a cluster is reloaded. Default: false
- `delete` - Event fired when a process is removed from PM2. Default: false
- `stop` - Event fired when a process is stopped. Default: false
- `restart overlimit` - Event fired when a process is reaches the max amount of times it can restart. Default: true
- `exit` - Event fired when a process is exited. Default: false
- `start` -  Event fired when a process is started. Default: false
- `online` - Event fired when a process is online. Default: false

You can simply turn these on and off by setting them to true or false using the PM2 set command.

```
pm2 set pm2-flock:log true
pm2 set pm2-flock:error false
```

## Options

The following options are available:

- `flock_url` (string) - Flock Incomming Webhook URL.
- `servername` / `username` (string) - Set the custom username for Flock messages (visible in message headers). Default: server hostname
- `buffer` (bool) - Enable/Disable buffering of messages. Messages that occur in short time will be concatenated together and posted as a single flock message. Default: true
- `buffer_seconds` (int) - If buffering is enables, all messages are stored for this interval. If no new messages comes in this interval, buffered message(s) are sended to Flock. If new message comes in this interval, the "timer" will be reseted and buffer starts waiting for the new interval for a new next message. *Note: Puspose is reduction of push notifications on Flock clients.* Default: 2
- `buffer_max_seconds` (int) - If time exceed this time, the buffered messages are always sent to Flock, even if new messages are still comming in interval (property `buffer_seconds`). Default: 20
- `queue_max` (int) - Maximum number of messages, that can be send in one Flock message (in one bufferring round). When the queue exceeds this maximum, next messages are suppresesed and replaced with message "*Next XX messages have been suppressed.*". Default: 100

Set these options in the same way as subscribing to events.


###### Example

The following configuration options will enable message buffering, and set the buffer duration to 5 seconds. All messages that occur within maximum 5 seconds delay between two neighboring messages will be concatenated into a single flock message.

```
pm2 set pm2-flock:flock_url https://hooks.flock.com/services/123456789/123456789/aaaaaaa
pm2 set pm2-flock:buffer_seconds 5
```

Note: In this example, the maximum total delay for messages is still 20 seconds (default value for `buffer_max_seconds`). After this time, the buffer will be flushed
everytime and all messages will be sent.

### Process based custom options

By default, all options are defined for all processes globally.
But you can separately define custom options to each PM2 process.
Use format `pm2-flock:optionName-processName` to process based custom options.

If no custom options is defined, the global `pm2-flock:propertyName` will be used.

Note: By this way, all custom options can be used for specific process, but events subsciptions configuration is always global only.

###### Example

We have many processes, includes process `foo` and process `bar`.
For this two processes will have to define separate Flock URL channel and separate server name.
Same buffer options will be used for all processed. 

```
# Define global options for all processes.
pm2 set pm2-flock:buffer_seconds 5

# Define global options for all processes.
#   (for process `foo` and `bar` the values will be overridden below).
pm2 set pm2-flock:flock_url https://hooks.flock.com/services/123456789/123456789/aaaaaaa
pm2 set pm2-flock:servername Orion

# Define custom Flock Incomming Webhoook for `foo` process.
pm2 set pm2-flock:flock_url-foo https://hooks.flock.com/services/123456789/123456789/bbbbbbb
pm2 set pm2-flock:servername-foo Foo-server
# Note: The `pm2-flock:buffer_seconds`=5 will be used from global options for this process. 

# Define custom Flock Incomming Webhoook for `bar` process
pm2 set pm2-flock:flock_url-bar https://hooks.flock.com/services/123456789/123456789/ccccccc
pm2 set pm2-flock:servername-foo Bar-server
# Note: The `pm2-flock:buffer_seconds`=5 will be used from global options for this process. 
```
  

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

