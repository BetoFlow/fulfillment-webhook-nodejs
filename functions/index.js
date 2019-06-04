// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const {google} = require('googleapis');
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Text, Card, Image, Suggestion, Payload} = require('dialogflow-fulfillment');
const {dialogflow, BasicCard, SimpleResponse} = require('actions-on-google');
const admin = require('firebase-admin');
const request = require('request');

const app = dialogflow({
  debug: true
});

// Do common tasks for each intent invocation
app.middleware((conv, framework) => {
  console.log(`Intent=${conv.intent}`);
  console.log(`Type=${conv.input.type}`);
  // Determine if the user input is by voice
  conv.voice = conv.input.type === 'VOICE';
  if (!(conv.intent === 'Default Fallback Intent' || conv.intent === 'No-input')) {
    // Reset the fallback counter for error handling
    conv.data.fallbackCount = 0;
  }
});
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const timeZone = 'America/Argentina/Buenos_Aires';  // Change it to your time zone
const timeZoneOffset = '-03:00';         // Change it to your time zone offset

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
	const agent = new WebhookClient({ request, response });
	console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
	console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

	function welcome(agent) {
		agent.add(`Welcome to my agent!`);
		}

	function fallback(agent) {
		agent.add(`I didn't understand`);
		agent.add(`I'm sorry, can you try again?`);
		}

	app.intent('Game', (conv, {artist}) => {
		conv.ask(new SimpleResponse({
			speech: "Hey, this is a simple response, okay?",
			text: "Hey, this is a simple response, okay?",
		}));
		conv.ask(new BasicCard({
		  text: `This is a basic card.  Text in a basic card can include "quotes" and
		  most other unicode characters including emoji 📱.  Basic cards also support
		  some markdown formatting like *emphasis* or _italics_, **strong** or
		  __bold__, and ***bold itallic*** or ___strong emphasis___ as well as other
		  things like line  \nbreaks`, // Note the two spaces before '\n' required for
									   // a line break to be rendered in the card.
		  subtitle: 'This is a subtitle',
		  title: 'Title: this is a title',
		  display: 'CROPPED',
		}));
	});

	function readFromDbEs (agent) {
	// Get the database collection 'menues' and document 'comidas'
	var nombre = agent.parameters.product !== ''? agent.parameters.product : 'noName';
	console.log(nombre);
	const dialogflowAgentDoc = db.collection('FirstCollection').doc(nombre);
	// Get the value of 'entry' in the document and send it to the user
	return dialogflowAgentDoc.get()
		.then(doc => {
			if (!doc.exists) {
			  agent.add('No tengo datos de la comida solicitada, ¿te puedo ayudar con algo más?');
			} 
			else {
				//agent.add(doc.data().composition_speech);
				
				/*agent.add(new Card({
							title: doc.data().nombre,
							//imageUrl: doc.data().imagenUrl,
							text: doc.data().descripcion,
							//buttonText: 'Linkedin Profile',
							//buttonUrl: doc.data().lDUrl
							}));*/
			  
				let conv = agent.conv();
				conv.ask(new SimpleResponse({
				  speech: doc.data().composition_speech + ' ¿Tenés otra consulta?',
				  text: doc.data().composition_text,
				  }));
				agent.add(conv);
				//agent.add('¿Tenés otra consulta?');
			}
			return Promise.resolve('Read complete');
		})
		.catch(() => {
			agent.add('Hubo un error intentando leer la base de datos');
		});
	}
	
	function preparation (agent) {
		// Get the database collection 'menues' and document 'comidas'
		var nombre = agent.parameters.product !== ''? agent.parameters.product : 'noName';
		console.log(nombre);
		const dialogflowAgentDoc = db.collection('FirstCollection').doc(nombre);
		// Get the value of 'entry' in the document and send it to the user
		return dialogflowAgentDoc.get()
			.then(doc => {
				if (!doc.exists) {
				  agent.add('No tengo datos de la comida solicitada, ¿te puedo ayudar con algo más?');
				} 
				else {
					//agent.add(doc.data().composition_speech);
					
					/*agent.add(new Card({
								title: doc.data().nombre,
								//imageUrl: doc.data().imagenUrl,
								text: doc.data().descripcion,
								//buttonText: 'Linkedin Profile',
								//buttonUrl: doc.data().lDUrl
								}));*/
                  
                    let conv = agent.conv();
                    conv.ask(new SimpleResponse({
                      speech: doc.data().preparation_speech + ' ¿Tenés otra consulta?',
                      text: doc.data().preparation_text,
                      }));
                    agent.add(conv);
					//agent.add('¿Tenés otra consulta?');
				}
				return Promise.resolve('Read complete');
			})
			.catch(() => {
				agent.add('Hubo un error intentando leer la base de datos');
			});
	}
	
	
	function doses (agent) {
		// Get the database collection 'menues' and snapshot.docsument 'comidas'
		var bugs = agent.parameters.bugs !== ''? agent.parameters.bugs : 'noName';
		var Sowing = agent.parameters.Sowing !== ''? agent.parameters.Sowing : 'noName';
		console.log(bugs);
		const dialogflowAgentDoc = db.collection('FirstCollection');
		// Get the value of 'entry' in the snapshot.docsument and send it to the user
		return dialogflowAgentDoc.where('disease_speech', '==', bugs).where('crops', '==', Sowing).get()
			.then(snapshot => {
				if (!snapshot.docs[0].exists) {
				  agent.add('No tengo datos de la info solicitada, ¿te puedo ayudar con algo más?');
				} 
				else {                  
                    let conv = agent.conv();
                    conv.ask(new SimpleResponse({
                      speech: 'Te recomiendo utilizar '+ snapshot.docs[0].data().name + ' en la siguiente dosis: ' + snapshot.docs[0].data().dose_speech + ' ¿Tenés otra consulta?',
                      text: snapshot.docs[0].data().dose_speech,
                      }));
                    agent.add(conv);
				}
				//return Promise.resolve('Read complete');
			})
			.catch(() => {
				agent.add('Hubo un error intentando leer la base de datos');
			});
	}	
  
  
	function Game2(agent) {
		const ssml= 
			`<speak>
				<par>
					<media>
						<audio src="https://actions.google.com/sounds/v1/animals/afternoon_crickets_long.ogg"/>
					</media>
					<media>
						<prosody> Let's go to play! </prosody>
					</media>
				</par>
			</speak>`;
		let conv = agent.conv();
    conv.close(ssml);
    agent.add(conv);

		//agent.add(`What is the mean of P in P A S?`);
		//agent.add(new Suggestion(`Products`));
		//agent.add(new Suggestion(`Potatoes`));
		//agent.context.set({ name: 'Trivia', lifespan: 2, parameters: { city: 'Game' }});

		}
	

	let intentMap = new Map();
	intentMap.set('Default Welcome Intent', welcome);
	intentMap.set('Default Fallback Intent', fallback);
	intentMap.set('Game', Game2);
  intentMap.set('productComposition', readFromDbEs);
	intentMap.set('preparation', preparation);
	intentMap.set('doses', doses);
	agent.handleRequest(intentMap);
});
