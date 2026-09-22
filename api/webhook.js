export default function handler(req, res) {
  // GET Request: Meta Webhook Verification
  if (req.method === 'GET') {
    // The token that you will paste into the Meta Dashboard
    const VERIFY_TOKEN = "hostel_secret_token_123";

    // Parse params from the webhook verification request
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        // Respond with 200 OK and challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.status(403).send('Verification failed');
      }
    } else {
      res.status(400).send('Missing parameters');
    }
  } 
  // POST Request: Incoming WhatsApp Messages and Status Updates
  else if (req.method === 'POST') {
    const body = req.body;

    // Check if this is an event from a WhatsApp API
    if (body.object) {
      // Log the incoming message/status (can be viewed in Vercel Server Logs)
      console.log('INCOMING_WEBHOOK_DATA:', JSON.stringify(body, null, 2));
      
      // Return a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      res.status(404).send('Not a WhatsApp event');
    }
  } 
  // Any other HTTP method
  else {
    res.status(405).send('Method Not Allowed');
  }
}
