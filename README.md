# CanVote :canada:

## Video Demo

[Click here to view the video](https://www.youtube.com/watch?v=pdOD73GqIrU&feature=youtu.be)


<img src="screens/img1.png">  

<img src="screens/img2.png">  

<img src="screens/img3.png">  

<img src="screens/img4.png">  


## Description of Web Application

**CanVote** :canada:, short for Canada Vote, is a web application that allows Canadian voters to vote for a candidate in their electoral district in a quick and efficient fashion. As well, it features the ability to show real-time election results, allowing the public to understand the grasp of which direction the country is heading towards. Overall, the web application works in the confines of an election, where the election contains multiple political parties, and electoral districts (or ridings) with candidates from each political party.

To ensure the stability of the election on **CanVote**, there are a variety of [user roles](#CanVote-Roles-and-User-Types) with different responsibilities.

*Side Note: For the sake of this project, the application will not account for all voters in the real-world as users of the application will have to speak english; can register with [an election officer](#election-officer-authenticated-user) beforehand; has access to a device with a modern browser; and has a webcam and voice recorder on their device.*

A public view of real-time riding results and which parties are leading in the polls can be viewed through bar charts in the application. When the voting period is over (i.e. all electoral districts have closed voting), a choropleth map can be accessed to view who has won a majority in each riding, and the overall results (similar to what you would see at the end of an election).

The inspiration for this web applications comes as statistics show that elections are [disproportionately against low-income citizens](https://www.theatlantic.com/politics/archive/2014/01/why-are-the-poor-and-minorities-less-likely-to-vote/282896/) (in the United States). With an application like **CanVote**, it can remove some (but not all) barriers such as being busy or not being able to physically go to a voting station. **CanVote** allows voters to register in advance with [election officers](#election-officer-authenticated-user) anytime before an election and then cast their ballot quickly during the election period. As well, recent news from the [2020 Iowa democratic caucuses](https://www.cbc.ca/news/world/iowa-caucus-democrats-1.5450749) has inspired us for a challenge to build something that can be better implemented and simple to use.

### API Documentation

The README for `/voting-service`, `/auth-service`, and `/ws-service` all contain API documentations for their respective services.

### CanVote Roles and User Types

#### Administrative Officer (Authenticated User)

An administrative officer is a non-bias actor which manages the foundations of the election, such as political parties, ridings, candidates, and [election officers](#election-officer-authenticated-user). This role can be thought of as a member of the administrative staff in Elections Canada. The resources they create is the first step in allowing voters to vote through the system.

#### Election Officer (Authenticated User)

An election officer is a non-bias actor which is responsible for managing voters in electoral districts. This role can be thought of as a government employee in a government office that registers a voters into the system, enabling voters access to the system.

#### Voter (Authenticated User)

A voter can vote once for a specific political party within their electoral district. When a vote is added, two resources are modified to ensure a voter doesn't vote again and a vote has been added - this ensures anonymity. To create an account, a voter should present government issued id to an election officer, and then the election officer should be able to proceed with creating their account.

#### Any Users

Like a real election, anyone can view voting results. As such, any user can view the voting results of each electoral district in real time through a bar chart. After all electoral districts have closed voting, then a choropleth map displaying parties that have won each electoral district can be viewed.

## Description of Technologies to be Utilized

1. **Frontend**
    - CSS Framework:
        - [Web Experience Toolkit (WET)](https://wet-boew.github.io/v4.0-ci/index-en.html): WET is a front-end framework designed and developed by the Government of Canada. Built on top Bootstrap 3.
    - JavaScript Libraries:
        - [React](https://reactjs.org/): Component based library to build repetitive UI.
        - [Axios](https://github.com/axios/axios): Promise based HTTP Client used to make HTTP ajax requests.
        - [Apollo Client](https://www.apollographql.com/docs/react/) w/ [Hooks](https://www.apollographql.com/docs/react/api/react-hooks/): A GraphQL client that includes state management. Takes care of requesting and caching data, as well as updating the UI.
        - [Chart.js](https://www.chartjs.org/): Chart library used for displaying election results
2. **Backend**
    - **Voting Microservice:** A service that exposes APIs to create, read, update and delete voting resources such as political parties, candidates, votes, and ridings.
        - Language: JavaScript (NodeJS)
        - Frameworks: [ExpressJS](https://expressjs.com/) + [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
        - Persistence: [MongoDB](https://www.mongodb.com/)
        - ORM: [Mongoose](https://mongoosejs.com/)
    - **Authentication Microservice:** A service that enables authentication, and manages user resources.
        - Language: Python
        - Framework: [FastAPI](https://github.com/tiangolo/fastapi)
        - Persistence: [PostgreSQL](https://www.postgresql.org/)
    - **Websocket Microservice:** A service that broadcasts votes in real-time through WebSockets by subscribing to data in MongoDB through Change Streams.
        - Language: JavaScript (NodeJS)
        - Framework: [ws](https://github.com/websockets/ws)
        - ORM: [Mongoose](https://mongoosejs.com/)
3. **Deployment**
    - [Docker](https://www.docker.com/)
    - [Kubernetes](https://kubernetes.io/) (on [GKE](https://cloud.google.com/kubernetes-engine))

## Top 5 Technical Challenges

1. **Security and Authentication:** As an application to be used for an election, it is very important that the application is to be implemented with strong security as a consideration. Therefore, the way the application is deployed, how to store data, and how data can be accessed must be carefully considered. In the next bullet point, we discuss how security will be a challenge with microservices. Furthermore, when dealing with authentication, we plan to utilize a combination of facial and voice recognition as a means for two factor authentication. The transition between first logging in with a username and password to the second factor of authentication will need to be carefully considered.
2. **Microservices:** Connecting all the services together will be a challenge. In class, we deal with monolithic applications, but in this project we hope to split everything into independent services and fuse it all in the end. Effectively combining all these services securely in production will add another challenge to our plate, such as stateless tokens.
3. **Charts and Maps:** This library is new to all of us, and we are hoping to use it for the map generation in the end. This does not seem trivial, and that is why it is a technical challenge.
4. **WebSockets:** WebSockets will be utilized to display data in real-time. As it is a different method of communicating to a backend compared to REST through HTTP, there will be some challenges as not all members have dealt with continuous communication.
5. **React:** The team members have little to no experience in this library. We are trying to learn this over the reading week, so it will be easier to create the frontend.

## Authors

- **[Dharmik Shah](https://github.com/dharm1k987)**
- **[Alvin Tang](https://github.com/alvintangz)**
