JUANRIDE: A DIGITAL VEHICLE RENTAL SYSTEM FOR
EFFICIENT BOOKING AND MONITORING
A Capstone Project
Presented to the Faculty of the
Information Technology Program
STI College Surigao
In Partial Fulfilment
of the Requirements for the Degree
Bachelor of Science in Information Technology
John Mark M. Camingue
Kim G. Cañedo
Nico Mar M. Oposa
Brennan Kean S. Sarvida
November 2025
STI College Surigao ii
ENDORSEMENT FORM FOR ORAL DEFENSE
TITLE OF RESEARCH: JuanRide: A Digital Vehicle Rental System
for Efficient Booking and Monitoring
NAME OF PROPONENTS: John Mark M. Camingue
Kim G. Cañedo
Nico Mar M. Oposa
Brennan Kean S. Sarvida
In Partial Fulfilment of the Requirements
for the degree Bachelor of Science in Information Technology
has been examined and is recommended for Oral Defense.
ENDORSED BY:
Ms. Darilyn Peñaranda-Esperanza
Capstone Project Adviser
APPROVED FOR ORAL DEFENSE:
Mr. Joemel E. Resare, MIT
Capstone Project Coordinator
NOTED BY:
Mr. Joemel E. Resare, MIT
Program Head
November 2025
STI College Surigao iii
APPROVAL SHEET
This capstone project titled: JuanRide: A Digital Vehicle Rental System for, prepared
and submitted by John Mark M. Camingue, Kim G. Cañedo, Nico Mar O. Oposa,
and Brennan Kean S. Sarvida, in partial fulfillment of the requirements for the degree
of Bachelor of Science in Information Technology, has been examined and is
recommended for acceptance and approval.
Ms. Darilyn Peñaranda-Esperanza
Capstone Project Adviser
Accepted and approved by the Capstone Project Review Panel
in partial fulfillment of the requirements for the degree of
Bachelor of Science in Information Technology
Dr. Evangelista, DIT, MSIT Dr. Gregorio, DIT, MSIT
Panel Member Panel Member
Engr. Rico Q. Asumen, MIT
Lead Panelist
Noted:
Mr. Joemel E. Resare, MIT Mr. Joemel E. Resare, MIT
Capstone Project Coordinator Program Head
November 2025
STI College Surigao iv
ACKNOWLEDGEMENTS
The proponents of this capstone project would like to express their heartfelt gratitude
and sincere appreciation to the individuals and groups whose guidance, support, and
encouragement have been instrumental to the completion of this work:
First and foremost, to our Almighty Father, whose strength and wisdom sustained us
throughout this journey — “I can do all things through Christ who strengthens me.”
(Philippians 4:13)
To our Project Adviser, Mrs. Dariyln Penaranda-Esperanza, for her invaluable
support, insights, and unwavering guidance that helped shape this project into its full
potential.
To our Program Head, Mr. Joemel E. Resare, MIT, for his continuous
encouragement and leadership throughout our academic journey.
To our interviewees, for generously sharing their time and input which provided vital
data for our study.
To our senior students Raymond Sales, Franz Mozar, and Ryan Elico for their help
during the development of this capstone. We also thank Carlstein for his steady help
throughout the process. Sir Mikko gave guidance that improved our direction, and we
acknowledge his role with appreciation.
To our parents, loved ones, friends, and classmates, for their endless love, moral
support, and encouragement in moments of both success and struggle.
This project would not have been possible without each and every one of you. Thank
you.
STI College Surigao v
Title of Research: JUANRIDE: A DIGITAL VEHICLE RENTAL SYSTEM
FOR EFFIECENT BOOKING AND MONITORING
Researchers: John Mark M. Camingue
Kim G. Cañedo
Nico Mar M. Oposa
Brennan Kean S. Sarvida
Degree: Bachelor of Science in Information Technology
Date of Compleion: November 2025
Key Words: Vehicle Rental System, Online Booking, Fleet Monitoring
ABSTRACT
The JuanRide project introduces a modernized vehicle rental system designed to
address the inefficiencies of traditional rental methods in Siargao Island. Currently,
rental businesses rely on manual booking processes, paper-based records, and social
media inquiries, leading to miscommunication, double bookings, and difficulty in
tracking rental durations and vehicle availability. These challenges highlight the urgent
need for a streamlined solution that enhances both operational efficiency and customer
convenience.
JuanRide is a centralized rental management platform that enables rental businesses to
efficiently oversee their fleet, monitor vehicle rentals in real-time, and automate
booking processes. For customers, the system provides an intuitive interface where they
can browse available vehicles, compare rental options, and secure reservations
seamlessly. By reducing dependency on outdated methods, JuanRide minimizes errors,
optimizes rental transactions, and improves overall customer satisfaction.
This capstone project aims to develop a scalable and adaptable solution that not only
modernizes the vehicle rental industry in Siargao but also serves as a model for
STI College Surigao vi
implementation in other tourist-heavy locations. With features such as real-time rental
tracking, structured payment management, and an enhanced booking experience,
JuanRide ensures a more efficient, accessible, and user-friendly approach to vehicle
rentals. Ultimately, this project contributes to the advancement of digital solutions in
the tourism and transportation sectors, fostering innovation and sustainable growth in
the industry.
STI College Surigao vii
TABLE OF CONTENTS
Page
Title Page i
Endorsement Form for Oral Defense ii
Approval Sheet
Acknowledgements
iii
iv
Abstract v
Table of Contents vii
List of Figures ix
List of Tables x
Introduction 1
Project Context 1
Purpose and Description 2
Objectives 3
Scope and Limitations 4
Review of Related Literature/Systems 6
Related Literature 6
Related Studies and/or Systems 8
Synthesis 14
Methodology 15
Technologies Background 17
Requirements Analysis 17
Requirements Documentation 18
Design of Software, System, Product, and/or Process 24
Data Flow Diagrams 26
Calendar of Activities 29
Resources 31
Results and Discussion TBA
Testing
Description of Prototype
Implementation Plan
Tba
Tba
Tba
STI College Surigao viii
Implementation Results Tba
Conclusions and Recommendations
References 32
Appendices 34
Resource Persons
Transcript of Interviews
Personal Technical Vitae
Attachments
User’s Guide
35
37
47
00
00
STI College Surigao ix
LIST OF FIGURES
Figure
1: Software Development Life Cycle (SDLC) Model
Page
24
2: JuanRide Context Diagram/Level 0 Data Flow Diagram
3: JuanRide Level 1 Data Flow Diagram
27
28
STI College Surigao x
LIST OF TABLES
Table
1: Gantt Chart of Activities
Page
30
2: Hardware Requirements 31
3: Software Requirements 31
STI College Surigao 1
CHAPTER 1
INTRODUCTION
Project Context
In Siargao Island, a renowned tourist destination, transportation plays a vital role in
ensuring smooth mobility for both residents and visitors. However, the vehicle rental
system remains outdated, relying on manual processes, paper-based records, and social
media inquiries. These traditional methods lead to inefficiencies such as
miscommunication, double bookings, and difficulty in tracking rental durations and
vehicle availability. With Siargao’s growing tourism industry, the demand for a more
efficient and accessible rental system has become increasingly evident, highlighting the
need for a modernized solution.
Many people who rent vehicles and the businesses that offer them face several
problems. For renters, most rental businesses still use old ways like posting on social
media, telling people by word-of-mouth, or using signs, which can be hard to find and
not very helpful. There is no one place where all rental options are shown, so customers
have to look in many different places or go to rental shops in person. It is also hard to
know if a vehicle is available or not, which can waste time. Many businesses do not
have a system for booking in advance, so customers often have to book manually and
may find out too late that the vehicle is not available.
Rental businesses also have problems. Many still use paper or spreadsheets to keep
track of rentals, which can cause mistakes or double bookings. It is hard for them to
track how long vehicles are rented, where the vehicles are, and if they are returned late.
Handling payments by hand can also lead to mistakes and make it harder to manage
their income. Lastly, because they use old ways to find customers, they may not reach
many people and lose chances to grow their business.
STI College Surigao 2
Purpose and Description
The primary purpose of JuanRide is to modernize and optimize vehicle rental services
in Siargao Island by introducing a digital platform that enhances the booking and
monitoring process. The system is designed to facilitate seamless transactions between
rental businesses and customers, ensuring a hassle-free experience for both parties.
Unlike traditional rental methods, JuanRide offers an intuitive, easy-to-use interface
that allows customers to search for available vehicles, compare rental options, and book
directly through a mobile or web application.
JuanRide is unique in its ability to provide real-time updates on vehicle availability,
ensuring that customers can make informed decisions before renting. The system also
includes a rental tracking feature, allowing business owners to monitor their rented
vehicles, track rental durations, and manage bookings more effectively. This feature
significantly reduces errors associated with manual documentation and eliminates the
risk of double bookings, which is a common issue in traditional rental systems.
What sets JuanRide apart from other existing platforms is its customized approach to
the Siargao rental market. The system is tailored to the needs of local rental businesses,
offering features such as flexible rental durations, multiple vehicle categories (e.g.,
motorcycles, scooters, vans), and user reviews to enhance credibility. The platform is
also designed to be scalable, which include additional features such as GPS tracking,
digital payments, and customer feedback mechanisms.
JuanRide is innovative and relevant because it leverages modern technology to solve a
pressing issue in Siargao’s tourism and transportation sector. By providing an efficient,
user-friendly solution, the project ensures that vehicle rental businesses operate more
smoothly while customers gain access to a more convenient and reliable way to rent
vehicles. Ultimately, JuanRide contributes to the local economy by improving the rental
experience, fostering better customer-business interactions, and supporting the growth
of tourism in Siargao.
STI College Surigao 3
Objectives
The objectives of this study are to guide the researcher and the reader in understanding
the necessary steps to develop and implement JuanRide effectively. These objectives
follow the sequence of addressing the primary problems faced by renters and rental
businesses:
• To investigate the existing vehicle rental system in Siargao Island, identifying
current business processes, challenges faced by renters and rental businesses,
and limitations of manual booking methods.
• To identify key requirements and user needs for a digital vehicle rental platform
by gathering insights from rental business owners and customers in Siargao
Island.
• To propose and evaluate essential features and functions for JuanRide to
streamline rental bookings, improve vehicle tracking, and enhance the overall
rental experience in Siargao Island.
• To assess and refine the proposed system by incorporating expert and
stakeholder feedback from Siargao Island to ensure feasibility and usability.
• To provide recommendations for implementation and future improvements
based on research findings and stakeholder insights from Siargao Island,
aligning JuanRide with the needs of both rental business owners and customers.
• To design a user-friendly interface for both renters and vehicle owners, ensuring
accessibility and ease of use within the JuanRide system.
• To ensure the security and integrity of rental transactions and personal data
within the platform through the development of secure payment and user
authentication features.
• To evaluate the technical feasibility of the system, ensuring it can be effectively
integrated with existing infrastructure in Siargao Island, including internet
connectivity and mobile device accessibility.
• To explore the potential impact of the JuanRide system on rental business
efficiency, customer satisfaction, and the local tourism industry in Siargao
Island.
• To analyze and document the challenges of implementing a digital vehicle rental
system in a remote area, addressing potential obstacles such as connectivity
issues, technological adoption, and user training.
STI College Surigao 4
SCOPE AND LIMITATIONS
Scope and Limitations of the Study
The aim of this study is to develop an integrated digital vehicle rental system for
JuanRide, designed to streamline the vehicle booking process and improve monitoring
capabilities for both renters and vehicle owners. The system will address the need for
efficient vehicle rentals, real-time availability tracking, maintenance monitoring, and
secure transactions.
The following are the scope and limitations of the study:
Scope
• The system provides vehicle rental functionalities such as: allowing renters to
book vehicles based on availability, preferred location in Siargao Island, rental
duration, and vehicle type; view detailed vehicle information including photos
and status; receive booking confirmations; and make secure online payments.
• The system requires both renters and vehicle owner to log in for access to secure
their accounts and manage transactions.
• The system enables vehicle owner to store available vehicles for rent, including
vehicle details such as type, pricing, and availability.
• The system includes payment features, allowing for secure digital transactions
and payment processing.
• The system activates GPS tracking through installed GPS devices on vehicles
to enable precise location monitoring and ensure accountability. These devices
allow for real-time tracking, making it easier to locate the vehicle quickly in
case of emergencies or if a renter encounters an issue, thus enabling rapid
response and support. Furthermore, in the event of a lost or stolen vehicle, the
GPS devices provide accurate location data to assist in recovery efforts.
• The system includes analytics to track rental trends and forecast demand,
helping owners optimize vehicle availability and pricing.
• The system allows vehicle owners to track and schedule maintenance services,
including regular inspections, repairs, and updates on the overall condition of
their vehicles, ensuring timely service and optimal performance.
STI College Surigao 5
• The system allows a non-refundable partial payment to be held as soon as the
vehicle is booked.
• The system allows renters to leave feedback and ratings for the vehicles and
service, promoting transparency and trust between renters and vehicle owners.
• The system enables vehicle owners to view detailed rental history for each
vehicle, including renter information, rental duration, and customer feedback,
helping them assess vehicle performance and customer satisfaction.
• The system sends notifications to both renters and vehicle owners, providing
real-time updates on booking confirmations, payment status, and upcoming
maintenance schedules, ensuring all parties stay informed throughout the rental
process.
• The system includes a customer support module, enabling users to report issues
and seek assistance.
• The system is designed to work on mobile devices, ensuring accessibility for
renters on the go.
Limitations
While the JuanRide system aims to streamline and enhance the vehicle rental process, it has
certain limitations that should be noted:
• The system does not include features for managing other services like fuel
payments or additional product offerings.
• The system does not allow rentersto modify vehicle types orspecifications once
the booking is confirmed.
• The system does not include multi-language support or customization for users
in non-English regions.
• The system does not include features for tracking or managing insurance claims
or legal matters associated with vehicle rentals.
STI College Surigao 6
CHAPTER 2
REVIEW OF RELATED LITERATURE/SYSTEMS
Related Literature
The digital transformation of vehicle rental services has become increasingly essential
as the industry faces challenges with outdated, manual processes. A significant trend in
recent literature is the shift towards digital platforms for booking, managing fleets, and
improving customer experiences. According to Nguyen, T. et al. (2021), digital
systems are key to enhancing operational efficiency and meeting the evolving demands
of customers in the mobility sector. The study highlights how the integration of webbased platforms helps rental businesses streamline operations and improve booking
accuracy by replacing traditional, error-prone manual methods.
Similarly, Li & Zhang (2022) explored the impact of cloud-based solutions in
managing car rental operations. Their research emphasizes the benefits of cloud
systems, such as real-time inventory tracking, automated payment processing, and
reduced operational overhead. They conclude that cloud technology enables rental
companies to offer more reliable services, enhance fleet management, and reduce
manual data entry errors. The study supports the idea that modernizing vehicle rental
operations is crucial to meeting customer expectations and improving business
efficiency.
The importance of mobile apps in the vehicle rental industry has also been discussed
by Perez & Caro (2023). Their research suggests that mobile applications have
revolutionized customer interaction with rental services. By allowing users to browse
available vehicles, make instant bookings, and complete payments from their
smartphones, these apps improve the overall customer experience. Furthermore, mobile
platforms enhance user convenience by providing access to rental services anytime and
anywhere. This has led to greater customer satisfaction and increased demand for rental
services, particularly in tourist areas.
Another crucial aspect of the digital transformation in car rental businesses is the
integration of GPS and telematics. A study by Wang & Lee (2021) highlights the role
of telematics in fleet management. By utilizing GPS tracking, car rental companies can
STI College Surigao 7
monitor vehicle location, prevent theft, and ensure vehicles are returned on time. The
real-time data provided by telematics also allows businesses to optimize fleet
deployment and improve operational efficiency, addressing some of the common pain
points in traditional rental systems.
Brown & Williams (2020) focused on the environmental impact of vehicle rental
systems and how digital solutions can contribute to sustainability. The study found that
by using digital platforms to optimize fleet management and reduce idle time, rental
companies can reduce fuel consumption and emissions. This aligns with the growing
global demand for more sustainable business practices in the transportation sector.
Lastly, Johnson et al. (2024) examined the customer perception of digital rental
services and their impact on the tourism industry. Their research reveals that tourists
increasingly prefer using digital rental systems for their convenience, transparency, and
speed. Online booking platforms not only streamline the process for tourists but also
improve the management of rental services in tourist-heavy areas, such as Siargao
STI College Surigao 8
Related Studies and/or Systems
International Sources
The study from IRJMETS (April 2024), titled “Revolutionizing Mobility:
Enhancing the User Experience Through Online Vehicle Rental Platforms,”
addresses the critical need for enhanced systems within the vehicle rental industry. It
highlights a rising demand for online vehicle service bookings facilitated by web-based
applications, alongside the necessity for an advanced information management system
tailored for the vehicle rental industry, as traditional manual processes are inadequate
for meeting modern customer expectations. To address these issues, the study proposes
an online management information system that enables clients to make reservations
easily, assists management in tracking rental vehicle inventory in real-time, and
provides a platform that facilitates transactions between rental branches, including
handling transportation transfers. The differentiation of this system lies in its
prioritization of data protection and simplified vehicle management, offering a userfriendly platform that contributes to providing excellent service to customers and
supporting operational efficiency. The benefits are significant, including the automation
of booking, reservation, and billing processes, which improves efficiency and security,
ultimately optimizing rental operations and providing a seamless experience for clients
and organizations.
The article from Scene.ae (2023-2025), titled “Revolutionizing Car Rentals: The
Digital Transformation Journey,” discusses the profound changes in car rental
services driven by new technology. It notes that traditional car rental processes were
often paper-heavy and time-consuming, creating a need for digital innovation and
improved data management, especially as customers seek more convenient rental
options, often without deposits. As a solution, rental companies are increasingly
integrating digital information systems, cloud storage, and Artificial Intelligence (AI).
This includes automated booking systems allowing customers to browse fleets and
confirm bookings from their smartphones, alongside real-time fleet management using
telematics and GPS. What sets these transformed systems apart is the use of AI
algorithms for risk assessment, enabling deposit-free rentals, smart city integration in
locations like Dubai, and the application of blockchain technology for secure, tamper-
STI College Surigao 9
proof records of rentals. These advancements lead to an enhanced customer experience
with faster verification processes, cost efficiency through reduced administrative
overheads, sustainability by eliminating physical paperwork, and improved security
through advanced tracking and monitoring.
The article from Auto Rental News (January 2025), titled “Rental Car Tech Trends
for 2025,” outlines the evolving technological needs and solutions within the car rental
industry. Car rental operators now require technologies that achieve more with less and
necessitate a strategic approach to installation and implementation. There's a pressing
need for integrated technologies that provide a streamlined experience for renters,
including digital proofs and signatures, accurate vehicle damage documentation, and
robust data for insurance claims, alongside better vehicle recovery and tracking
systems. To meet these demands, the industry is adopting telematics integration with
rental software systems to better manage vehicle availability and prevent theft. AI tools
are also being deployed to verify identities, assess insurance coverage, score risk levels,
and enhance employee roles. Furthermore, digital lost-and-found tracking systems with
reliable custody chains and geofencing to track vehicle locations and set boundary rules
are becoming crucial. The differentiation of these new systems is highlighted by AI
algorithms capable of handling 80% of customer service inquiries, real-time tracking
for faster vehicle recovery, the integration of telematics with camera systems for
contextual information on vehicle behavior, and automated pricing changes based on
vehicle availability. The benefits derived from these technologies include an enhanced
customer experience with faster verification processes, reduced time spent working
with law enforcement for vehicle recovery, better prediction of rental fleet maintenance
needs, and improved security through advanced tracking and monitoring.
The report from GlobeNewswire (January 2025), titled “Global Self-Drive Car
Rental Strategic Business Report 2024-2030,” emphasizes the rising demand for
flexible, private, and independent travel solutions. This trend is driven by a need for
cost-effective mobility options without the financial burden of car ownership, an
increasing preference for controlled, private travel experiences over shared
transportation, and the necessity for convenient transportation solutions in dense urban
environments. In response, the industry is leveraging mobile apps and digital platforms
to streamline the rental process, offering contactless pick-up and drop-off options where
STI College Surigao 10
users can unlock cars using an app. Advanced telematics and GPS tracking systems are
being implemented for improved safety and fleet management, complemented by IoT
connectivity to gather data on fuel consumption, mileage, and engine health. These
platforms differentiate themselves by providing real-time vehicle availability and
transparent pricing, integrated GPS navigation and customer support in mobile apps,
contactless service reducing in-person interactions, and personalized promotions based
on AI analysis of customer usage patterns. The resulting benefits for consumers include
increased convenience and flexibility for travelers, reduced waiting times through
contactless service, enhanced safety via real-time monitoring of vehicle location and
driving behavior, and for businesses, optimized fleet maintenance and reduced
operational costs.
National Sources
The study from SSRN (March 2021), titled “Development of Car Rental
Management System with Scheduling Algorithm,” addresses the need for a system
to manage the activities of car rental businesses specifically in the Philippines. It
highlights the necessity for easy and reliable transaction processing and effective
management of transactions, scheduling, and car inventory. The proposed solution is a
car rental management system incorporating a scheduling algorithm, developed using
the Extreme Programming Methodology to replace manual processes with a digital
system. This system is differentiated by its integration of a scheduling algorithm for
efficient operation, which has received a positive response based on criteria of speed
and its graphical user interface, and its specific design to address identified problems
within the Philippine context. The benefits of such a system include making business
transactions easy and reliable, enabling effective management of transactions,
scheduling, and inventory, and satisfying users with its performance and efficiency.
The study by IJARSCT (June 2024), titled “Revolutionizing the Rental Services in
Siargao Island: Basis for Developing an Online Vehicle Rental Management
System,” focuses on the inefficiencies faced by tourists and local rental service
providers in Siargao Island. These include unreliable service, booking difficulties, and
inefficient fleet management, indicating a gap between traditional practices and modern
technological solutions. The proposed solution is an online vehicle rental management
STI College Surigao 11
system designed to streamline operations, utilizing advanced system software to
automate bookings and optimize fleet management, along with real-time updates and
notifications to enhance operational efficiency. The differentiation of this system stems
from its mixed-methods approach, which integrates qualitative insights and quantitative
data, its specific design for Siargao Island’s unique context, and a user-friendly
interface tailored to local needs. The benefits are manifold: it reduces errors and
improves service reliability, empowers local rental businesses to manage operations
more effectively, enhances accessibility, convenience, and customer satisfaction, and
ultimately contributes to the sustainable growth of Siargao’s tourism industry.
The analysis by Mordor Intelligence (2025), titled “Philippines Car Rental Market
Size & Share Analysis,” identifies key needs driving the Philippine car rental market.
These include the increasing cost of owning a car, which makes renting more attractive,
a growing demand from visitors and ex-pats requiring reliable transportation, the need
for detailed access to accommodations, services, and benefits through online platforms,
and a rising demand for car rental services from both travelers and local commuters.
Solutions being implemented involve the expansion of rental car services through
websites and online platforms, integration with the Internet of Things (IoT) for
monitoring performance and maintenance, online booking systems providing detailed
information about services, and real-time monitoring tools for fleet managers and
drivers. The market differentiation is characterized by a focus on authentic travel
experiences, convenience, and value for money, a significant shift from traditional to
online booking (with 60% of bookings now made online), real-time performance
monitoring and maintenance tracking, and specialized services catering to tourism and
business segments. The benefits include easier access to rental services due to increased
internet infrastructure, time-saving advantages of online bookings, quick identification
of potential problems and implementation of improvements, and enhanced mobility
options for travelers in the tourism industry.
The report from Research and Markets (January 2024), titled “Philippines Car
Rental Industry Set to Reach $448.7 Mn by 2027,” highlights the need for flexible,
cost-effective travel options in the Philippines. This is coupled with growing demand
from tourists and corporate clients for private transportation, a need for convenient
booking options aligned with technological advancements, and a specific demand for
STI College Surigao 12
medium-sized vehicles that balance comfort, affordability, and practicality. To meet
these needs, the industry is adopting online booking platforms that leverage increased
internet connectivity, and mobile apps for browsing, booking, and paying for vehicles
directly from smartphones. They are also offering diverse vehicle options, including
economy, compact, mid-size, and luxury vehicles, with tailored rental durations from
hourly to weekly options. The differentiation in this market is seen in the shift toward
online booking platforms (with approximately 60% of bookings now conducted online),
the preference for medium-sized vehicles due to their balance of comfort and
practicality, a tailored analytical approach per sub-sector of the rental market, and a
fragmented market landscape that presents opportunities for differentiation through
service quality. The benefits for users include enhanced comfort with digital platforms,
more privacy, freedom, and control for travelers, especially on long trips, practical
transportation solutions for tourists with luggage requirements, and a reduced financial
burden compared to car ownership.
Local Sources
The information from Car Rental Siargao (2025), detailed on their website “Car
Rental Siargao Rent A Car Self Drive,” addressesthe transportation needs for tourists
exploring Siargao’s attractions. There is a clear need for flexible transportation options
on the island and convenient pickup options for visitors arriving by air or ferry. Their
solution is to provide self-drive rental cars for touring the island, with delivery of these
cars to various arrival points such as the airport or ferry terminal, and an option for
guided rentals with a driver/tour guide. They differentiate themselves through their
intimate knowledge of Siargao Island, enabling them to make valuable
recommendations, offering both self-drive and guided rental options, and leveraging
more than three years of experience in car rental services on Siargao Island. The benefits
for customers include the flexibility to explore Siargao’s attractions at their own pace,
the convenience of having a car delivered to their arrival point or accommodation, and
access to local expertise to enhance their island experience.
The service overview from Siargao Van Rentals (2025), found at a caters to the need
for transportation for groups traveling together on Siargao Island. This includes the
need to explore the island’s dispersed attractions and providing options for those who
STI College Surigao 13
prefer not to drive themselves. Their solution involves offering van rental services with
clear requirements and procedures, options for hiring drivers or tour guides, and a
comprehensive list of van rental providers on the island, along with detailed information
about local driving conditions. The differentiation of theirservice lies in the comparison
of different service options (self-drive, driver, tour guide) and practical advice specific
to driving on Siargao Island. The benefits for travelers include the ability to
accommodate groups of 8-12 people, the flexibility to explore at one’s own pace even
with a driver, access to local knowledge through tour guides, and cost-effective
transportation for groups.
STI College Surigao 14
Synthesis
The reviewed literature and studies clearly show that the vehicle rental industry faces
serious problems when using old, manual methods. Internationalsources like IRJMETS
(2024) and Auto Rental News (2025) point out that traditional booking systems often
cause errors, delays, and poor customer service. These studies stress that digital
platforms are now a critical solution for improving service quality, tracking vehicles in
real time, and handling payments and records accurately. They highlight the importance
of features like automated bookings, GPS tracking, and online verification to make
rentals faster and safer.
In response, the JuanRide project was created with clear goals. It aims to modernize the
rental system in Siargao by developing a digital platform for both business owners and
customers. The system lets users book vehicles online, check availability in real time,
and make secure payments. It helps owners manage their fleet, monitor rentals, and
track income. JuanRide also aims to reduce double bookings, improve customer
satisfaction, and support local tourism. It is built to be scalable, meaning it can grow
and be used in other tourist locations. These aims were designed to directly solve the
problems found in the reviewed studies.
The synthesis of the literature reveals a strong agreement on the need for digital
transformation in the vehicle rental industry. Most studies emphasize how digital
systems improve efficiency, reduce human error, and enhance user satisfaction.
Whether local or international, the literature consistently shows that technology-driven
platforms are essential for solving common problems in rental services and for
supporting long-term business growth.
STI College Surigao 15
CHAPTER 3
METHODOLOGY
Technical Background
The following technologies are suggested for the system:
• Web Application: The JuanRide web application is being developed using Next.js
14 and Node.js to create a simple and user-focused platform for both vehicle owners
and renters. Next.js 14 is a React-based framework that helps build responsive
interfaces while supporting server-side rendering (SSR) and static site generation
(SSG). These features contribute to faster page loading and better usability. Next.js also
allows the use of reusable components, which helps speed up development and makes
future updates easier.
Node.js, a JavaScript runtime built on Chrome’s V8 engine, powers the backend of the
application. Its event-driven setup is suitable for handling multiple users at the same
time. This part of the system is responsible for managing user requests, handling vehicle
listings, and processing transactions. Using Next.js 14 and Node.js together offers a
functional and responsive environment for the needs of JuanRide’s users.
• Mobile Application: To make the system accessible on mobile devices, JuanRide is
also being developed as a mobile application using Android Studio. Instead of creating
a fully separate mobile version, the mobile app will use a web view. This setup allows
users to access the full web platform through the app, without needing to switch
between two different systems. With this method, the mobile app delivers the same
features and functionality as the web version. Using Android Studio also ensures that
the app works smoothly on Android devices, providing convenience for users who are
always on the go.
• Database Management System: JuanRide uses Supabase, a backend-as-a-service 
platform built on PostgreSQL, as the primary database and backend infrastructure. 
Supabase provides a robust relational database system that efficiently manages 
structured data including vehicle details, user profiles, rental bookings, payment 
transactions, real-time messaging, and system logs.

PostgreSQL, the underlying database engine, is a powerful open-source relational 
database known for its reliability, data integrity, and support for complex queries. 
It enables the platform to maintain relationships between entities such as users, 
vehicles, bookings, and payments through foreign keys and joins, ensuring data 
consistency and accuracy.
STI College Surigao 16
Supabase extends PostgreSQL with built-in features including:
  - Real-time subscriptions for live updates (used in chat messaging)
  - Row-Level Security (RLS) policies for fine-grained access control
  - Built-in authentication system with JWT tokens
  - RESTful API and client SDK for seamless integration
  - Cloud storage for vehicle images and documents

This architecture provides enterprise-grade security, automatic scaling, and real-time 
capabilities that are essential for JuanRide's booking system, chat features, and 
instant availability updates.
• Hosting and Deployment: The JuanRide platform is planned to be hosted using
DigitalOcean and GoDaddy. DigitalOcean provides the cloud hosting infrastructure
needed to keep the system available and stable. This means users can access the
platform at any time without major interruptions.
GoDaddy is used for domain registration, giving the platform an official and easy-toremember web address. Together, these services help ensure that the JuanRide website
runs smoothly and is accessible to both owners and renters.
• Styling and Design: To make the interface clean, modern, and easy to use, the system
is styled using Tailwind CSS and Shadcn/UI. Tailwind CSS is a utility-first framework
that lets developers build designs quickly using predefined classes. It supports
responsive layouts, making the platform work well on different screen sizes.
Shadcn/UI is a component library that provides ready-made UI elements like buttons,
input fields, and navigation bars. These components are accessible and easy to integrate,
helping the team build a better-looking and more user-friendly platform without starting
from scratch.

• Payment Processing System: JuanRide integrates PayMongo, a Philippine-based 
payment gateway, to handle all financial transactions securely and efficiently. PayMongo 
enables the platform to accept multiple payment methods that are widely used in the 
Philippines, particularly catering to the local market in Siargao.

The payment system supports the following methods:
  - GCash: The most popular mobile wallet in the Philippines, allowing instant 
    payments through QR codes or mobile numbers. This addresses the preference 
    for cashless transactions mentioned in stakeholder interviews.
  - Maya (formerly PayMaya): Another widely-used e-wallet platform providing 
    similar digital payment capabilities.
  - Credit/Debit Cards: Visa, Mastercard, and other major card networks for 
    international tourists and users who prefer traditional payment methods.
  - Bank Transfers: Direct bank transfer options for customers who prefer this method.

Payment Flow Implementation:
1. Payment Intent Creation: When a renter proceeds to checkout, the system creates 
   a PayMongo payment intent with booking details and total amount.
2. Secure Payment Processing: Renters are redirected to PayMongo's secure payment 
   page where they select their preferred payment method (GCash, Maya, or card).
3. Real-time Verification: The system receives instant webhooks from PayMongo 
   confirming successful or failed transactions.
4. Automatic Fee Calculation: Database triggers automatically calculate the 10% 
   platform service fee and 90% owner payout upon successful payment.
5. Booking Confirmation: Once payment is verified, the booking status updates to 
   "confirmed" and both renter and owner receive email notifications.
6. Transaction Records: All payment details, including transaction IDs, timestamps, 
   and amounts, are securely stored in the database for audit trails.

This integration addresses the pain points mentioned by vehicle owners in interviews, 
particularly the GCash cash-out fees and partial payment issues. The system ensures 
full payment before booking confirmation, eliminating the "pay half now, half later" 
problem that causes delays and follow-ups. The automated fee splitting also provides 
transparency for both platform operators and vehicle owners regarding revenue sharing.
STI College Surigao 17
Requirements Analysis
In developing JuanRide, the goal is to provide a digital vehicle rental solution tailored
to the needs of both vehicle owners and renters, especially on Siargao Island. This
system will address current challenges in manual booking, availability tracking, and
communication by offering a centralized digital platform. The analysis below outlines
the core elements of the current problem and how the system addresses them:
Who – The People Involved:
• Vehicle Owners (individuals/businesses renting out vehicles)
• Renters (tourists and locals looking for rentals)
• Admins (manage listings, users, and reported issues)
What – The Business Activity:
• Vehicle rental process (listing, searching, booking, tracking)
• Digital alternative to manual and informal booking methods
• Central platform to streamline owner-renter transactions
Where – The Environment:
• Mainly used in Siargao Island (target area with tourism activity)
• Accessible on mobile phones and computers
• Works with internet access in both urban and remote areas
When – The Timing:
• Users can access and use the system anytime
• Bookings and availability updated in real-time
• Allows advanced and scheduled reservations
How – Current Procedures:
• Manual contact through calls, texts, or social media
• No consistent record of bookings or availability
• JuanRide will automate listings, bookings, and notifications
STI College Surigao 18
Requirements Documentation
The JuanRide system is a comprehensive digital platform designed to modernize and
optimize the vehicle rental experience, particularly in tourism-driven areas such as
Siargao Island. The system serves as a bridge between renters and vehicle owners,
offering seamless online booking, real-time vehicle availability tracking, secure digital
payments, and automated rental management. JuanRide aims to deliver a reliable,
efficient, and safe rental ecosystem. This document outlines the functional and nonfunctional requirements critical to delivering an effective and user-centered experience
for both renters and vehicle owners.
Functional Requirements
For Renters:
1.1 Real-Time Vehicle Browsing
• View a list of currently available vehicles filtered by type, location,
price, and availability date.
1.2 Online Booking & Instant Confirmation
• Reserve vehicles with instant system confirmation, minimizing
manual processing.
1.3 Advanced Filters
• Search and filter vehicles by category (scooter, car, van, etc.),
location, budget, duration, and ratings.
1.4 Transparent Pricing and Rental Terms
• Display clear pricing, rental duration options (hourly/daily/weekly),
insurance coverage, and policies before booking.
1.5 Online Payment Options
• Multiple payment channels including e-wallets (GCash, Maya),
bank transfers, and card payments.
1.6 Booking Notifications & Return Reminders
• Automated SMS/in-app notifications for booking confirmation, due
time, and return reminders.
1.7 In-App Chat Support
STI College Surigao 19
• Real-time messaging support for inquiries, issues, or negotiation.
1.8 Ratings & Reviews
• Submit and view ratings for both vehicles and owners.
1.9 Vehicle GPS Tracking
• Track current rental status and location (shared voluntarily or
required for certain listings).
1.10 Mobile-Friendly UI
• Fully responsive design optimized for smartphone and tablet use.
For Owners/Admin:
2.1 User Account Management
• The admin should be able to create, update, and delete user
accounts for both renters and vehicle owners.
• The admin should be able to assign user roles (e.g., renter, vehicle
owner) and manage permissions accordingly.
• The system should allow the admin to reset user passwords upon
request.
• Admin should be able to view detailed user profiles, including past
rental history, feedback, and ratings.
2.2 Booking Management System
• Accept, decline, or modify bookings with calendar synchronization.
2.3 Vehicle Listing Management
• Add and delete vehicles in the system for rental availability.
• Upload and manage photos of each vehicle for display to customers.
• Set and update the status of vehicles (e.g., available, rented, under
maintenance).
• Admin should be able to set pricing for each vehicle and define terms
and conditions for renting.
• Ensure all vehicles have complete and valid documents before
listing them in the system.
2.4 Real-Time Vehicle Availability Dashboard
STI College Surigao 20
• Overview of which vehicles are rented, booked, or idle.
2.5 Comprehensive Dashboard
• View earnings, booking stats, and vehicle condition reports.
2.6 GPS Vehicle Tracking
• Track vehicle location to prevent loss or misuse.
• The GPS tracker pinpoints the vehicle's location during
emergencies, when a renter faces an issue, or if the vehicle is
missing, enabling quick response and precise recovery.
2.7 Payment and Transaction Management
• The admin should have access to view all transactions made within
the system, including rental payments, refunds, and any additional
charges.
2.8 Feedback and Rating Management
• Admin should be able to monitor and manage feedback and ratings
left by renters and vehicle owners.
• The system should allow the admin to filter or sort feedback based
on vehicle, renter, or owner.
• Admin should be able to flag or remove inappropriate or fraudulent
reviews or ratings.
2.9 Vehicle Pricing
• The system supports dynamic pricing based on vehicle type.
• Transparent pricing tiers are shown to customers during the booking
process.
• A partial, non-refundable upfront payment is required to confirm a
booking, with the amount varying by vehicle type and total rental
cost.
• The remaining balance is paid upon vehicle pickup or according to
the owner’s rental terms.
3.1 Maintenance and Inventory Tracking
• Admin should be able to monitor and manage vehicle maintenance
schedules, ensuring that vehicles are regularly serviced and safe for
renters.
STI College Surigao 21
• The system should allow the admin to log vehicle maintenance
activities and update the status of vehicles under repair.
• Admin should be able to generate maintenance reports to track
recurring issues or costs.
3.2 Notifications and Alerts
• Admin should receive notifications for critical actions such as
booking requests, cancellations, payment issues, or vehicle
maintenance updates.
• The system should send automated notifications to users for
booking confirmations, payment receipts, maintenance alerts, or
feedback requests.
3.3 Reporting and Analytics
• Admin should be able to access a dashboard with key performance
indicators (KPIs) such as booking volume, revenue, and customer
satisfaction metrics.
• The system should allow the admin to generate detailed reports,
including user activity, transaction summaries, and maintenance
logs.
• Admin should have the ability to export reports in formats like
PDF or Excel.
• Monthly reports of income, rentals, customer feedback, etc.
3.4 System Configuration and Settings
• Admin should be able to configure system settings such as rental
rates, booking policies, and user permissions.
• The system should allow the admin to update the platform's terms
and conditions, privacy policy, and other legal documents.
• Admin should be able to manage payment gateway settings and
integrate with third-party payment processors.
Non-Functional Requirements
For Both Renter and Owner
1. Availability
STI College Surigao 22
• System should be accessible 24/7 via web and mobile.
Usability
• Clean, intuitive UI designed for tech and non-tech-savvy users alike.
Performance
• Bookings and page responses should load in under 3 seconds.
Security
• All user data must be encrypted. Include secure login, verified ID
upload, and payment processing.
Scalability
• Should support scaling to more locations or thousands of users.
Reliability
• Maintain >99% uptime with a support system in place for outages.
Data Backup
• Regular backups to prevent data loss.
Legal Compliance
• Ensure proper handling of data per local laws(Data Privacy Act PH).
For Administrator
1. Usability
• The system should have an intuitive and easy-to-navigate interface
for the admin, ensuring minimal training requirements.
• The admin interface should be responsive and mobile-friendly,
allowing access from various devices including smartphones and
tablets.
2. Performance
• The system should be capable of handling a high volume of user
traffic and bookings simultaneously, ensuring no performance
degradation during peak usage periods.
• The admin dashboard should load promptly, even when accessing
large datasets such as transaction history or user feedback.
3. Security
• The system should implement strong user authentication methods
(e.g., multi-factor authentication) for admin access to ensure data
security.
STI College Surigao 23
• All sensitive data, including user information and payment details,
should be encrypted both in transit and at rest.
• The system should log all admin activities for auditing purposes,
including user account changes and financial transactions.
4. Scalability
• The system should be scalable to accommodate growth in both the
number of users and vehicles listed on the platform.
• Admin should be able to scale the system by adding more rental
locations, vehicles, and users without performance issues.
5. Reliability
• The system should be designed for high availability, with minimal
downtime for maintenance and updates.
• In case of a system failure, data should be recoverable, and users
should be notified of any issues promptly.
• The system should be able to back up critical data regularly to
prevent data loss.
6. Compatibility
• The admin system should be compatible with major web browsers
(e.g., Chrome, Firefox, Safari, Edge).
• The system should also support integration with third-party
platforms, such as payment gateways and external booking
systems.
7. Maintainability
• The system should be modular and well-documented, making it
easier for developers to update or extend features in the future.
• Admin should be able to perform basic maintenance tasks, such as
adding new vehicles, adjusting rates, or updating contact
information, without requiring developer support.
8. Compliance
• The system must comply with local regulations related to vehicle
rentals, payment processing, and user data protection.
• Admin should ensure the platform adheres to relevant laws and
regulations in Siargao Island and any future regions where
JuanRide operates.
STI College Surigao 24
Design of Software, System, Product, and/or Processes
Waterfall Development Methodology
The development of JuanRide: A Digital Vehicle Rental System follows the Waterfall
Software Development Life Cycle (SDLC) model, chosen for its systematic and
sequential approach. This section introduces how the project’s software, system, and
processes were designed based on clearly defined requirements. The Waterfall model
allows each phase—from planning and analysis to design, coding, testing, and
maintenance—to be completed in a logical order. This methodology supports a
structured workflow that fits well within academic schedules and ensures that each
component of the system is built and documented with clarity and consistency.
Figure 1
Software Development Life Cycle (SDLC) Model
1. Requirements
Identify inefficiencies in Siargao’s manual vehicle rental system through stakeholder
interviews and surveys. Define functional needs (e.g., online booking, real-time
tracking, secure payments) and non-functional needs (e.g., scalability, 24/7 availability).
Document user requirements for renters (vehicle browsing, reviews) and owners (fleet
management, analytics) to create a centralized digital platform.
Requirements
Design
Implementation
Testing
Development
Maintenance
STI College Surigao 25
2. Design
Develop system architecture, including user interface wireframes for web/mobile,
PostgreSQL database schema via Supabase for vehicle/user data, and process flows for
booking/payment. Plan responsive layouts using Next.js and Tailwind CSS. Design
Row-Level Security (RLS) policies for data protection and define database triggers for
automated business logic. Ensure scalability and security (encrypted data, JWT-based
authentication) to meet Siargao's tourism-driven needs.
3. Implementation
Code the platform using Next.js for the web frontend with server-side rendering,
Supabase for backend services including authentication, database, and real-time features,
and Android Studio for a mobile web view. Implement database migrations with SQL
for schema definition and triggers. Build features like vehicle listings with approval
workflow, booking forms with conflict detection, real-time chat messaging, GPS tracking,
and PayMongo payment integration. Develop middleware for route protection and role-
based access control.
4. Testing
Conduct unit testing for individual modules (e.g., booking, payment), integration
testing for combined components, and user acceptance testing (UAT) with Siargao
stakeholders. Address bugs and performance issues to ensure reliability, fast load
times, and compliance with functional requirements.
5. Development
Host the platform on DigitalOcean for cloud stability and register the domain via
GoDaddy. Launch the web and mobile app for Siargao users, ensuring 24/7 accessibility.
Provide initial user training for renters and owners to adopt the system effectively.
6. Maintenance
Monitor system performance post-launch, fixing bugs and applying security updates.
Implement user-requested enhancements (e.g., new features) and scale the platform for
additional locations. Conduct regular data backups and ensure compliance with local
data privacy laws.
STI College Surigao 26
Data Flow Diagram
Data Flow Legend
GREEN represents the Vehicle Owner
BLUE represents the Vehicle Renter
RED represents the System Administrator
STI College Surigao 27
Figure 2
JuanRide Context Diagram/Level 0 Data Flow Diagram
STI College Surigao 28
Figure 3
JuanRide Level 1 Data Flow Diagram
STI College Surigao 29
Calendar of Activities
The calendar of activities outlines the timeline followed by the proponents in the
preparation and completion of the capstone project’s documentation. Spanning
from February to April, this phase was dedicated to the research, planning, and
writing necessary to define the project’s purpose, objectives, scope, and technical
background.
During this period, the proponents focused on identifying the problem, reviewing
related literature, analyzing user requirements, and planning the system’s
conceptual design. Each section of the documentation was carefully developed to
align with academic standards and provide a strong foundation for future system
development.
This calendar highlights the structured and research-driven approach taken by the
proponents, ensuring that every stage of documentation was completed
thoroughly and systematically. The system development phase is planned for a
later time, once all preparatory documentation has been finalized.
STI College Surigao 30
Table 1
Gantt Chart of Activities
MONTH
FEBRUARY MARCH APRIL MAY JUNE JULY AUGUST SEPTEMBER OCTOBER NOVEMBER
ACTIVITY
1 Documentation
1.1. Project Context
1.2. Purpose and Description
of the Project
1.3 Objectives of the Study
1.4 Scopes and Limitations of
the Study
1.5 Review of Related
Literature/Systems
1.6 Synthesis
1.7 Technical Background
1.8 References
2 Systems Development
2.1 Design Interface
2.2 Database Design
2.3 Coding
2.4 Debugging System
2.5 Testing
2.6 Error Correction
2.7 System Organization
2.8 System Improvement
STI College Surigao 31
Resources
Table 2
Hardware Requirements
Device Predator Helios, Gigabyte G5
RAM 8 GB, 16 GB
Storage 512 GB SSD, 1 TB SSD
Graphics Integrated Graphics, NVIDIA GeForce
RTX 3060
Display 15.6-inch Full HD (144Hz)
Operating System 1920 x 1080 (Minimum Recommended)
Table 3
Software Requirements in Developing the System
Operating System Windows 10 / 11 (Recommended),
Android 6.0+ (Minimum for mobile)
Database and Backend Supabase (PostgreSQL-based BaaS),
Authentication, Real-time, Storage
Web Development Tools Visual Studio Code (IDE), Next.js 14,
React, TypeScript, Tailwind CSS,
Shadcn/UI
Mobile Development Tools Android Studio (WebView)
Payment Integration PayMongo API (GCash, Maya, Cards)
Email Service Resend (Transactional emails)
Server and Hosting Vercel/DigitalOcean (Web hosting),
Supabase Cloud (Database),
GoDaddy (Domain Management)
Web Browsers Compatible with Chrome, Firefox,
Microsoft Edge, Safari
STI College Surigao 32
RESULTS AND DISCUSSION

System Architecture & Implementation

The JuanRide platform implements a three-tier architecture with frontend (Next.js), 
backend (Supabase), and database (PostgreSQL) layers featuring sophisticated security 
and automation.

Authentication Flow: User registration creates auth.users records with JWT tokens. 
Database triggers automatically create user profiles. Middleware intercepts requests 
for role-based routing (admin→/admin/dashboard, owner→/owner/dashboard, 
renter→homepage).

Vehicle Search: VehicleGrid calls searchVehicles() querying is_approved=true vehicles. 
Date-specific searches use filterByAvailability() checking booking conflicts and 
blocked_dates arrays to prevent double-bookings.

Booking Creation: Database triggers automatically populate owner_id, validate no 
conflicts exist (raising exceptions if detected), and update vehicle status to 'rented' 
when confirmed.

Real-Time Chat: Supabase channels provide real-time messaging. Components subscribe 
to INSERT events on messages table, displaying new messages instantly without refresh.

Payment Processing: PayMongo integration supports GCash, Maya, and cards. After 
payment confirmation, triggers calculate 10% platform fee and 90% owner payout. 
Resend service sends email confirmations to both parties.

Admin Approval: Admins query is_approved=false vehicles, update approval status, 
and createNotification() informs owners their listings are live.

Security: Middleware provides session validation and role-based guards. Row-Level 
Security (RLS) policies ensure users only access authorized data. Owner routes require 
'owner' or 'admin' roles; admin routes require 'admin' only.

Testing
STI College Surigao 33
Description of Prototype
STI College Surigao 34
Implementation Plan
STI College Surigao 35
Implementation Results
STI College Surigao 36
CONCLUSIONS AND RECOMMENDATIONS
STI College Surigao 37
REFERENCES
Anderson,J., &Davis, K.(2021).Enhancing trust and reliability in digitalrental
platforms.
Romjue, M. (2025, January 2). Rental Car Tech Trends for 2025. © 2025 Auto Rental
News, Bobit. All Rights Reserved.
https://www.autorentalnews.com/10233427/rental-car-tech-trends-for-2025
MarB Concepts Events Management Services. (n.d.). Car Rental Siargao Rent a car
self drive PHP3,000. Siargao Car Rentals. https://www.carrentalsiargao.com/
Markets, R. A. (2025, January 31). Global Self-Drive Car Rental Strategic Business
Report 2024-2030: Rising demand for Private and Cost-Effective Mobility
Solutions, Smart Cities and Eco-Friendly Fleets Accelerate market growth.
GlobeNewswire News Room. https://www.globenewswire.com/newsrelease/2025/01/31/3018611/28124/en/Global-Self-Drive-Car-RentalStrategic-Business-Report-2024-2030-Rising-Demand-for-Private-and-CostEffective- Mobility-Solutions-Smart-Cities-and-Eco-Friendly-FleetsAccelerate-Mar.html
Golo, N. M. a. T., & Encarnacion, N. R. E. (2024). Revolutionizing the rental services
in Siargao Island: Basis for developing an online vehicle rental management
system. International Journal of Advanced Research in Science
Communication and Technology, 438–447. https://doi.org/10.48175/ijarsct18754
Maheshwari, R., & Joshi, P. (2024). Revolutionizing mobility: Enhancing the user
experience through online vehicle rental platforms. International Research
Journal of Modernization in Engineering Technology and Science, 6(4).
https://www.irjmets.com/uploadedfiles/paper//issue_4_april_2024/53672/final
/fin_irjmets1713757628.pdf
Philippines car rental market size | Mordor Intelligence. (n.d.).
https://www.mordorintelligence.com/industry-reports/philippines-car-rentalmarket
Markets, R. A. (2024, January 18). Philippines car rental industry set to reach $448.7
mn by 2027 in new market analysis. GlobeNewswire News Room.
https://www.globenewswire.com/newsrelease/2024/01/18/2811804/28124/en/Philippines-Car-Rental-Industry-Set-toReach-448-7-Mn-by-2027-in-New-Market-Analysis.html
STI College Surigao 38
Armstrong, B. (2024c, December 24). Revolutionizing Car Rentals: the Digital
Transformation journey. Scene. https://scene.ae/the-evolution-of-the-carrental-industry-with-digital-information-upkeep/
Siargao van Rentals - Rent a van in Siargao. (n.d.). https://siargaorental.com/siargaovan-rental
Albino, M. (2021, March 1). Development of Car Rental Management System with
Scheduling Algorithm.
https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3849830
Brown, A., & Williams, C. (2020). The environmental impact of vehicle rental
systems and the role of digital solutions. Journal of Sustainable
Transportation, 18(2), 95-112.
https://doi.org/10.1080/22053538.2020.1725310
Johnson, M., Smith, R., & Lee, T. (2024). Customer perception of digital car rental
services in the tourism industry. Journal of Tourism Management, 56(1), 22-
38. https://doi.org/10.1016/j.tourman.2023.102128
Li, S., & Zhang, Y. (2022). Cloud-based solutions for car rental business
management. International Journal of Information Technology &
Management, 21(3), 159-174.
https://doi.org/10.1080/15634850.2022.1901123
Nguyen, T., Vo, D., & Pham, T. (2021). Digital transformation in the mobility sector:
The case of car rental businesses. Journal of Business Innovation, 15(4), 110-
128. https://doi.org/10.1177/2020214821998553
Perez, J., & Caro, P. (2023). Mobile applications revolutionizing the car rental
industry. International Journal of Mobile Technology, 19(2), 47-63.
https://doi.org/10.1038/jmt.2023.048
Wang, X., & Lee, J. (2021). Telematics integration for fleet management in the car
rental industry. Journal of Automotive Technology and Management, 10(3),
133-147. https://doi.org/10.1080/20200439503
STI College Surigao 39
APPENDICES
STI College Surigao 40
APPENDIX A. RESOURCE PERSONS
STI College Surigao 41
Name: Darilyn Peñaranda
Resource Type: Instructor
Name: Arah Dolera
Resource Type: Vehicle Rental Owner
Name: Jefferson Ramirez
Resource Type: Vehicle Rental Owner
Name: Christofferson Cos
Resource Type: Renter
Name: John Kenneth Comandante
Resource Type: Renter
Name: Jaymar Cervantes
Resource Type: Renter
STI College Surigao 42
APPENDIX B. TRANSCRIPT OF INTERVIEWS
STI College Surigao 43
TRANSCRIPT OF INTERVIEW
Representative of a Family-Owned Vehicle Rental Business in Siargao
Name of Interviewers: John Mark M. Camingue
Kim G. Cañedo
Nico Mar M. Oposa
Brennan Kean S.
Sarvida
Name of Interviewee: Arah Z. Dolera
Date: 11/16/2025
Time Start: 10:41 AM
Time End: 11:04 AM
Brennan: Good day, Miss Arah. Thank you for your time. First, please state your
name for the record.
Miss Arah: Hello. I am Arah Z. Dolera, the daughter of the owners of our family’s
vehicle rental business. I also help manage some of the daily operations.
Brennan: How did your family first get into the vehicle rental business, and what
encouraged you to continue it through the years?
Miss Arah: We started with pump boat rentals for island-hopping. Later, my parents
decided to offer motorbike rentals so we would not depend only on sea activities. As
more visitors came to Siargao, my parents stayed motivated and continued growing
the business.
Brennan: How do you currently handle bookings, inquiries, and confirmations?
Miss Arah: Most customers come from different resorts. The resort owners or their
staff contact my mother directly. Some renters also visit our house to check the units
and confirm. Everything is done manually through calls, texts, and walk-ins.
Brennan: Do you use any online platforms or tools to promote your rentals?
Miss Arah: My parents do not use social media, so we handle the online promotion.
We post on our Facebook accounts to share available units, rates, and updates. This
helps us reach tourists who plan ahead.
Brennan: What common problems do you experience with renters, especially tourists
or foreign clients?
STI College Surigao 44
Miss Arah: Some renters return the motorbike to the resort instead of our house,
which makes it harder to find the unit. Others refuse to leave their ID even if it is part
of our agreement. Many tourists are cautious about documents, so they try to
negotiate or avoid the requirement.
Brennan: What issues do you face with the vehicles themselves?
Miss Arah: Maintenance is constant because motorbikes experience wear and tear.
Late returns also happen. We have a penalty of one hundred pesos per hour, but some
renters ask for consideration. Some return late without informing us, which makes
tracking harder.
Brennan: How do you handle payments, and what challenges do you encounter?
Miss Arah: We accept cash, GCash, and bank transfers. GCash has a cash out fee that
we shoulder, which lowers our income. Some renters pay only half at first and
promise to settle the rest later. This leads to delays and follow-ups.
Brennan: How do you set your terms and agreements, and how do you make sure
renters follow them?
Miss Arah: We require renters to sign an agreement form. It includes rules,
responsibilities, return time, and penalties. We also ask for one valid ID. If they
refuse, we require a refundable deposit instead. We explain everything clearly before
releasing a unit.
Brennan: During peak seasons, do you have difficulty checking which units are
available?
Miss Arah: So far, no. We still manage it manually and we can track which units are
out. But it becomes time consuming when inquiries increase.
Brennan: If a digital system could track rentals, show availability, record payments,
and improve communication, would you consider using it?
Miss Arah: Yes. It would make our work easier. It would help us track everything in
one place and avoid errors from manual recording.
Brennan: What features would you want this kind of system to have?
Miss Arah: Real time availability, automatic rental tracking, digital agreements, ID
and payment verification, maintenance reminders, and complete payment records. It
would be better if the system could send notifications and organize inquiries in one
place.
Brennan: Thank you, Miss Arah. Your answers will help us a lot in developing the
system.
STI College Surigao 45
APPENDIX C. PERSONAL TECHNICAL VITAE
STI College Surigao 46
CURRICULUM VITAE
Name: Kim G. Cañedo
Address: Brgy. 10, Pob. Dapa SDN
Email: kimcanedo@gmail.com
Contact No.: 09517931373
Parents
Name of Mother: Lolla G. Cañedo
Name of Father: Leo S. Cañedo
EDUCATIONAL BACKGROUND
Level Inclusive Dates Name of school/ Institution
Tertiary Ongoing STI College Surigao
High School 05/2016-04/2019 Dapa National High School
Elementary 05/2009-04/2015 Dapa Central Elementary School
SKILLS
Sporty
Editor
Dancing
Video Editor
STI College Surigao 47
CURRICULUM VITAE
Name: Nico Mar M. Oposa
Address: Brgy. 13, Pob. Dapa SDN
Email: nicooposa@gmail.com
Contact No.: 09501326651
Parents
Name of Mother: Aurora M. Oposa
Name of Father: Mamerto E. Oposa, Sr.
EDUCATIONAL BACKGROUND
Level Inclusive Dates Name of school/ Institution
Tertiary Ongoing STI College Surigao
High School 05/2016-04/2019 Siargao National Science High School
Elementary 05/2009-04/2015 Dapa Central Elementary School
SKILLS
Video Editor
Math Problem Solving
Decision Making
Cooking
STI College Surigao 48
CURRICULUM VITAE
Name: John Mark M. Camingue
Address: Brgy. 13, Pob. Dapa SDN
Email: jmcamingue12@gmail.com
Contact No.: 09517931382
Parents
Name of Mother: Anabell M. Camingue
Name of Father: Marlon G. Camingue
EDUCATIONAL BACKGROUND
Level Inclusive Dates Name of school/ Institution
Tertiary Ongoing STI College Surigao
High School 05/2016-04/2019 Dapa National High School
Elementary 05/2009-04/2015 Dapa Central Elementary School
SKILLS
Editor
Dancing
Singing
Sporty
Game
STI College Surigao 49
CURRICULUM VITAE
Name: Brennan Kean S. Sarvida
Address: P1 Lower Ceniza,Surigao City, Surigao Del Norte
Email: brennankeansarvida@gmail.com
Contact No.: 09452374733
Parents
Name of Mother: Lea S. Sarvida
Name of Father: Ramel E. Sarvida
EDUCATIONAL BACKGROUND
Level Inclusive Dates Name of school/ Institution
Tertiary Ongoing STI College Surigao
High School 05/2014-04/2018 Surigao Education Center
Elementary 05/2008-04/2014 Surigao City Pilot School
SKILLS
Dancing
Singing
Sporty
Gamer
Photography and Editing
Web Developer
STI College Surigao 50
APPENDIX D. ATTACHMENTS
STI College Surigao 51
SURVEY RESULT AND ANALYSIS
JuanRide: A Digital Vehicle Rental System for Efficient Booking and
Monitoring (Owners)
PART I: BUSINESS PROCESS
STI College Surigao 52
STI College Surigao 53
Part II: Functionalities
STI College Surigao 54
JuanRide: A Digital Vehicle Rental System for Efficient Booking and
Monitoring (Renters)
PART I: BUSINESS PROCESS
STI College Surigao 55
STI College Surigao 56
STI College Surigao 57
STI College Surigao 58
STI College Surigao 59
PART II: FUNCTIONALITIES
Google Form: Survey for Vehicle Owners
https://docs.google.com/forms/d/e/1FAIpQLSeLdi0iBs9-
QnKmihdF5PnSt6yTqLbhCHDICKoX7tr6N-zNUg/viewform?usp=dialog
Google Form: Survey for Vehicle Renters
https://docs.google.com/forms/d/e/1FAIpQLScXTWJkOF9vxdBls3ISt5Pg_831Zx
MsOUyfnWqDE8jdLFBzHQ/viewform?usp=dialog
STI College Surigao 60
APPENDIX E. USER’S GUIDE
STI College Surigao 61
JuanRide
User’s Manual
STI College Surigao 62
Table of Contents
For Owner
For the Admin
For Renters