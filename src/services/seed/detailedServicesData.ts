
export const CATEGORIES = [
  {
    id: 'cat_wedding_planning',
    name: 'Wedding Planning & Management',
    slug: 'wedding-planning-management',
    short_desc: 'Bespoke high-end wedding curation, production, and luxury coordination.',
    icon: '💍',
    display_order: 1,
    thumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cat_destination_weddings',
    name: 'Destination Weddings',
    slug: 'destination-weddings',
    short_desc: 'Enchanting experiences across major global luxury resorts and local beach retreats.',
    icon: '🏝️',
    display_order: 2,
    thumbnail: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cat_birthday_celebrations',
    name: 'Birthday Celebrations',
    slug: 'birthday-celebrations',
    short_desc: 'Grand milestone anniversary events, kid-themed birthdays and elite celebrations.',
    icon: '🎂',
    display_order: 3,
    thumbnail: 'https://images.unsplash.com/photo-1530103862676-fa39665a526b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cat_corporate_events',
    name: 'Corporate Events',
    slug: 'corporate-events',
    short_desc: 'Executive brand activation setups, annual award galas, and professional seminars.',
    icon: '🏛️',
    display_order: 4,
    thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cat_anniversary_celebrations',
    name: 'Anniversary Celebrations',
    slug: 'anniversary-celebrations',
    short_desc: 'Romantic surprise dynamic designs, high-end dinners, and beautiful custom flower settings.',
    icon: '💖',
    display_order: 5,
    thumbnail: 'https://images.unsplash.com/photo-1513271922710-310517430b99?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cat_other_social',
    name: 'Other Social Events',
    slug: 'other-social-events',
    short_desc: 'Engagement ceremonies, baby showers, and family celebrations tailored to perfection.',
    icon: '✨',
    display_order: 6,
    thumbnail: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cat_hospitality_ops',
    name: 'Hospitality & Event Operations',
    slug: 'hospitality-event-operations',
    short_desc: 'Premium guest RSVP systems, transport assistance, room allotment, and professional coordination.',
    icon: '💁',
    display_order: 7,
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'
  }
];

export const DETAILED_SERVICES = [
  // 1. Wedding Planning & Management (13)
  {
    catId: 'cat_wedding_planning',
    services: [
      { name: 'Venue Selection', desc: 'Curating a portfolio of India\'s most prestigious heritage palaces and luxury grand ballrooms, ensuring a backdrop that perfectly reflects your union\'s grandeur.', ico: '🏰', img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hotel & Resort Selection', desc: 'Identifying elite properties that offer the perfect blend of world-class guest comfort, superior room service, and logistical ease for multi-day festivities.', ico: '🏨', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Wedding Decoration', desc: 'Crafting breathtaking thematic landscapes with bespoke furniture and sophisticated lighting designs that transform any space into a romantic fairytale wonderland.', ico: '🎨', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
      { name: 'Floral Decoration', desc: 'Artisanal arrangements featuring exotic imported blooms and fragrant local flora, meticulously styled into custom installations that define botanical luxury.', ico: '🌸', img: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&q=80&w=800' },
      { name: 'Stage & Mandap Setup', desc: 'Designing majestic sacred mandaps and grand reception stages that serve as the focal point of your union, blending traditional sanctity with modern artistic elegance.', ico: '⛩️', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
      { name: 'Bridal Entry', desc: 'Creating cinematic and emotionally resonant entrance concepts, utilizing unique traditional motifs and modern theatrical elements for a truly stunning reveal.', ico: '👸', img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800' },
      { name: 'Groom Entry', desc: 'Orchestrating high-energy arrival concepts for the groom, from royal vintage car processions to traditional baraat entries with live bands and dhol performers.', ico: '🤴', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
      { name: 'Baraat Setup', desc: 'Setting the rhythmic pulse of your celebration with professional brass bands and traditional folk dancers to make the groom\'s procession legendary and vibrant.', ico: '🎺', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Photography & Films', desc: 'Capturing fleeting emotions and grand moments through the lenses of award-winning cinematic teams specializing in high-definition digital storytelling artistry.', ico: '📸', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Catering Services', desc: 'Indulging your palate with bespoke multi-cuisine menus curated by master chefs, featuring gourmet live counters and white-glove service standards.', ico: '🍽️', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800' },
      { name: 'Entertainment', desc: 'A high-octane blend of celebrity artists, live acoustic bands, and professional DJs guaranteed to keep your guests energized and the dance floor packed.', ico: '🎵', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hospitality Management', desc: 'Seamless end-to-end guest care, from professional RSVP tracking to on-site reception helpdesks that ensure every invitee feels like a cherished VIP.', ico: '💁', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Wedding Coordination', desc: 'Expert on-the-ground execution by a dedicated elite team managing every micro-detail and vendor timeline so you can focus entirely on your joy.', ico: '📋', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 2. Destination Weddings (13)
  {
    catId: 'cat_destination_weddings',
    services: [
      { name: 'Destination Planning', desc: 'Strategic logistical planning for weddings in exotic locations, handling everything from local scouting to international travel and cultural alignment.', ico: '🌍', img: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
      { name: 'Venue Selection', desc: 'Identifying breathtaking destination venues, from secluded Goa beaches to Rajasthan\'s royal palaces, perfectly matching your vision and capacity.', ico: '🏰', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hotel & Resort Booking', desc: 'Securing blocks of premium rooms at luxury properties, negotiating the best corporate rates and managing complex check-in schedules for traveling guests.', ico: '🏨', img: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=800' },
      { name: 'Guest Accommodation', desc: 'Personalized hospitality desk services to manage guest stays, bespoke room drops, and personalized welcome kits at elite destination resorts.', ico: '🛏️', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Guest Transportation', desc: 'Coordinating seamless airport pickups and premium local shuttle services to ensure your guests travel comfortably throughout the destination region.', ico: '🚐', img: 'https://images.unsplash.com/photo-1532347922424-c652d9b7208e?auto=format&fit=crop&q=80&w=800' },
      { name: 'Wedding Decoration', desc: 'Adapting luxury decor concepts to destination settings, from wind-resistant beach setups to grand palace transformations with local artistic flair.', ico: '🎨', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
      { name: 'Floral Decoration', desc: 'Sourcing and styling exotic floral arrangements that thrive in destination climates, adding a touch of natural beauty to every ceremonial space.', ico: '🌸', img: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&q=80&w=800' },
      { name: 'Stage & Mandap', desc: 'Bespoke mandap designs that integrate the natural beauty of your destination, whether it\'s a sunset beach backdrop or a historical courtyard.', ico: '⛩️', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
      { name: 'Photography & Cinematography', desc: 'Elite visual storytellers who specialize in destination weddings, capturing the unique landscape and atmosphere of your chosen location in stunning detail.', ico: '🎥', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Entertainment', desc: 'Curating a mix of local cultural artists and professional global entertainers to provide a vibrant and diverse experience for your destination guests.', ico: '🎵', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Catering', desc: 'Collaborating with world-class destination chefs to create menus that celebrate local flavors while providing international gourmet standards.', ico: '🍽️', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hospitality Management', desc: 'Dedicated destination hospitality teams who provide 24/7 assistance to guests, ensuring a seamless and luxury vacation-like wedding experience.', ico: '💁', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Wedding Coordination', desc: 'Remote and on-site coordination expertise to manage local vendors and logistical complexities of hosting a wedding away from home.', ico: '📋', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 3. Birthday Celebrations (16)
  {
    catId: 'cat_birthday_celebrations',
    services: [
      { name: 'Birthday Planning', desc: 'Innovative planning for milestone birthdays, from whimsical children\'s theme parties to sophisticated adult anniversary galas.', ico: '🎁', img: 'https://images.unsplash.com/photo-1530103862676-fa39665a526b?auto=format&fit=crop&q=80&w=800' },
      { name: 'Venue Selection', desc: 'Finding the perfect setting for your birthday, from intimate private villas and trendy cafes to grand banquet halls and lush outdoor gardens.', ico: '🏛️', img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800' },
      { name: 'Theme Decoration', desc: 'Transforming your venue into a thematic wonderland with custom backdrops, unique props, and immersive decor that brings your vision to life.', ico: '🎨', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
      { name: 'Balloon Decoration', desc: 'Creating a magical atmosphere with organic balloon installations, custom-shaped arches, and thematic balloon clouds in vibrant colors.', ico: '🎈', img: 'https://images.unsplash.com/photo-1530103862676-fa39665a526b?auto=format&fit=crop&q=80&w=800' },
      { name: 'Floral Decoration', desc: 'Elegant and whimsical floral arrangements designed to complement your birthday theme, from delicate table centers to grand floral entrances.', ico: '🌸', img: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&q=80&w=800' },
      { name: 'Stage Decoration', desc: 'Designing eye-catching birthday stages that serve as the perfect backdrop for cake cutting, performances, and memorable photographs.', ico: '🎭', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
      { name: 'Welcome Setup', desc: 'Setting the tone from the start with creative welcome boards, interactive entryways, and thematic registration desks for your guests.', ico: '🚪', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Cake Arrangement', desc: 'Sourcing spectacular custom-designed cakes that serve as edible masterpieces and the delicious, centerpiece of your celebration.', ico: '🎂', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800' },
      { name: 'Kids Entertainment', desc: 'A fun-filled array of activities for younger guests, including professional face painters, puppet shows, and interactive game coordinators.', ico: '🎠', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800' },
      { name: 'Mascot Characters', desc: 'Bringing favorite stories to life with professional mascot performers who engage with children and provide wonderful photo opportunities.', ico: '🦊', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800' },
      { name: 'Magic Show', desc: 'Captivating guests of all ages with professional magicians who perform mind-bending tricks and interactive stage illusions.', ico: '🪄', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800' },
      { name: 'DJ', desc: 'High-energy DJ services with custom playlists designed to keep the party atmosphere alive and the guests dancing throughout the celebration.', ico: '🎧', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Photography & Videography', desc: 'Capturing the joy and excitement of your birthday through professional lenses, providing a beautiful collection of digital memories to cherish.', ico: '📸', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Catering', desc: 'Deliciously curated menus featuring crowd-pleasing snacks, gourmet main courses, and delightful dessert spreads tailored to your birthday theme.', ico: '🍽️', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hospitality', desc: 'Ensuring guest comfort with professional helpdesks, assistance with gift management, and overall guest care throughout the event.', ico: '💁', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Event Coordination', desc: 'On-site coordination to manage the timeline of activities, from the arrival of entertainers to the grand cake cutting ceremony.', ico: '📋', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 4. Corporate Events (18)
  {
    catId: 'cat_corporate_events',
    services: [
      { name: 'Corporate Planning', desc: 'Professional end-to-end planning for business events, ensuring your corporate brand is projected with absolute sophistication and precision.', ico: '📊', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Conferences', desc: 'Executing seamless large-scale conferences with professional stage management, high-tech AV setups, and meticulous delegate coordination.', ico: '🏛️', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Seminars', desc: 'Organizing focused educational and industry seminars with professional seating arrangements, presentation technology, and refreshment management.', ico: '🎤', img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800' },
      { name: 'Product Launch', desc: 'Creating high-impact launch events for new products, utilizing creative stage reveals, professional lighting, and media-ready presentation spaces.', ico: '🚀', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Award Nights', desc: 'Glamorous and prestigious award ceremonies designed to celebrate corporate achievements with grand stage production and professional hosting.', ico: '🏆', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Annual Day', desc: 'Coordinating large-scale company celebrations with a mix of professional entertainment, family engagement activities, and grand buffet dining.', ico: '🎉', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Dealer Meets', desc: 'Facilitating productive dealer and distributor meetups with professional business environments and elite hospitality standards.', ico: '🤝', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Team Building Activities', desc: 'Designing engaging and innovative activities that foster collaboration and boost employee morale in a fun and professional environment.', ico: '🧗', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Exhibitions', desc: 'Providing complete stall design, construction, and logistical support for trade shows and industry exhibitions to maximize your brand visibility.', ico: '🎪', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Brand Activation', desc: 'Creative experiential marketing setups designed to engage your target audience and create lasting brand impressions through interactive displays.', ico: '💡', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Stage Setup', desc: 'Professional corporate stage designs featuring clean lines, integrated LED screens, and high-quality podiums for speakers and presenters.', ico: '🎭', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
      { name: 'Sound & Lighting', desc: 'Elite audio-visual solutions including line-array sound systems and intelligent stage lighting to ensure your message is heard and seen clearly.', ico: '🔊', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Live Streaming', desc: 'Professional multi-camera live streaming services to broadcast your corporate events to a global audience with high-definition clarity.', ico: '🎥', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Photography', desc: 'Capturing high-quality professional imagery for corporate documentation, social media, and internal communications.', ico: '📸', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Catering', desc: 'Sophisticated corporate catering options ranging from executive packed lunches to grand gala dinner buffets with professional service.', ico: '🍽️', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hospitality Management', desc: 'Providing elite hospitality services for VIP delegates, including professional reception teams and concierge assistance throughout the event.', ico: '💁', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Guest Registration', desc: 'Efficient digital registration systems including QR code check-ins and professional badge printing to manage attendee flow seamlessly.', ico: '📝', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Event Coordination', desc: 'Dedicated on-site coordinators to manage the complex moving parts of your corporate event and ensure perfect execution of the schedule.', ico: '📋', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 5. Anniversary Celebrations (13)
  {
    catId: 'cat_anniversary_celebrations',
    services: [
      { name: 'Anniversary Planning', desc: 'Heartfelt and elegant planning for milestone anniversaries, celebrating your unique journey with a personalized and romantic touch.', ico: '💑', img: 'https://images.unsplash.com/photo-1513271922710-310517430b99?auto=format&fit=crop&q=80&w=800' },
      { name: 'Venue Selection', desc: 'Securing intimate and charming venues that provide the perfect romantic backdrop for your anniversary dinner or reception.', ico: '🏰', img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800' },
      { name: 'Romantic Decoration', desc: 'Creating an atmosphere of love with soft lighting, candle arrangements, and elegant drapery designed for an unforgettable experience.', ico: '🕯️', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
      { name: 'Floral Decoration', desc: 'Exquisite floral styling featuring deep roses and delicate lilies, arranged to symbolize the enduring beauty of your shared years together.', ico: '🌸', img: 'https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&q=80&w=800' },
      { name: 'Balloon Decoration', desc: 'Whimsical and festive balloon arrangements in soft metallic tones to add a playful yet sophisticated element to your anniversary party.', ico: '🎈', img: 'https://images.unsplash.com/photo-1530103862676-fa39665a526b?auto=format&fit=crop&q=80&w=800' },
      { name: 'Stage Decoration', desc: 'Designing a beautiful central stage for speeches, toast giving, and cake cutting, styled to reflect the elegance of your anniversary.', ico: '🎭', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
      { name: 'Live Music', desc: 'Enhancing the romantic mood with professional live musicians, from solo violinists to soft acoustic bands performing your favorite songs.', ico: '🎻', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'DJ', desc: 'Professional DJ services providing a balanced mix of nostalgic hits and modern tracks to keep your anniversary guests entertained on the dance floor.', ico: '🎧', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Photography', desc: 'Documenting the celebration of your love with professional photography, providing high-quality digital assets that capture the essence of your anniversary.', ico: '📸', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Cake Arrangement', desc: 'Custom-designed anniversary cakes that celebrate your years together with elegant sugar artistry and delicious gourmet flavors.', ico: '🎂', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800' },
      { name: 'Catering', desc: 'Exquisite multi-course dining experiences featuring gourmet dishes and fine beverage pairings curated for your special celebration.', ico: '🍽️', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hospitality', desc: 'Ensuring your guests feel welcome and cared for with professional reception services and assistance throughout your anniversary event.', ico: '💁', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Surprise Planning', desc: 'Specializing in the discrete coordination of surprise elements, from secret video messages to unexpected guest arrivals, adding magic to your event.', ico: '✨', img: 'https://images.unsplash.com/photo-1513271922710-310517430b99?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 6. Other Social Events (16)
  {
    catId: 'cat_other_social',
    services: [
      { name: 'Engagement Ceremony', desc: 'Celebrating your commitment with a beautifully planned ring ceremony featuring elegant decor and heartfelt ceremonial arrangements.', ico: '💍', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
      { name: 'Ring Ceremony', desc: 'Focused planning for the ring exchange moment, including grand stage reveals and professional documentation of this special milestone.', ico: '✨', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
      { name: 'Baby Shower', desc: 'Creating a whimsical and joyful atmosphere with thematic pastel decor and interactive games to celebrate your upcoming bundle of joy.', ico: '🍼', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Housewarming', desc: 'Coordinating traditional and modern housewarming events with auspicious decor and warm hospitality to welcome friends to your new home.', ico: '🏠', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Retirement Party', desc: 'Honoring a dedicated career with a professional yet personal celebration featuring career highlights and elegant social arrangements.', ico: '🕰️', img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800' },
      { name: 'Farewell Party', desc: 'Creating a memorable and emotional send-off with personalized touches, professional entertainment, and a warm social atmosphere.', ico: '👋', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Family Celebration', desc: 'Planning meaningful gatherings for family reunions and special occasions, ensuring multi-generational fun and pristine event execution.', ico: '👨‍👩‍👧‍👦', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Religious Events', desc: 'Respectful and traditional planning for religious ceremonies, providing appropriate decor and logistical support for sacred observances.', ico: '🛐', img: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800' },
      { name: 'Festive Events', desc: 'Bringing holiday spirit to life with grand-scale festive decor and high-energy community celebrations for major cultural festivals.', ico: '🎊', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Naming Ceremony', desc: 'Celebrating a new arrival with elegant and traditional naming ceremony arrangements, including thematic decor and guest hospitality.', ico: '👶', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Cultural Events', desc: 'Showcasing heritage and arts with professionally planned cultural events featuring traditional performances and thematic artistic displays.', ico: '🎭', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Decoration', desc: 'Providing bespoke decoration solutions for any social gathering, adapting to your specific event vision with high-end aesthetic choices.', ico: '🎨', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
      { name: 'Photography', desc: 'Capturing the candid joy of your social celebrations with professional digital photography that preserves every special moment.', ico: '📸', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800' },
      { name: 'Catering', desc: 'Delicious social event catering with a focus on fresh ingredients and crowd-pleasing menus designed for diverse guest lists.', ico: '🍽️', img: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800' },
      { name: 'Entertainment', desc: 'Curating a mix of fun and engaging entertainment options for social gatherings, from live musicians to interactive party hosts.', ico: '🎵', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hospitality', desc: 'Ensuring your social event guests feel comfortable and well-attended with friendly and professional on-site hospitality services.', ico: '💁', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' }
    ]
  },
  // 7. Hospitality & Event Operations (24)
  {
    catId: 'cat_hospitality_ops',
    services: [
      { name: 'RSVP Management', desc: 'Utilizing advanced digital systems to track guest responses, manage meal preferences, and provide real-time attendance reports.', ico: '📱', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Guest Registration', desc: 'Seamlessly managing on-site arrival with professional registration desks, QR-code based check-ins, and digital badge distribution.', ico: '📝', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Welcome Desk', desc: 'Establishing a friendly first point of contact for guests, providing essential information, event itineraries, and personalized welcome kits.', ico: '🛎️', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Help Desk', desc: 'Maintaining a central support station throughout the event to address guest queries, logistical needs, and any last-minute requirements.', ico: 'ℹ️', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hospitality Desk', desc: 'Dedicated professional teams stationed at hotels and venues to provide concierge-level assistance to your honored guests around the clock.', ico: '💁', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Guest Relations', desc: 'Focusing on the comfort and experience of your high-profile guests, ensuring personalized attention and elite service standards at all times.', ico: '🤝', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Runner Services', desc: 'Providing highly efficient logistical runners to handle immediate on-site errands, material transfers, and quick-response support tasks.', ico: '🏃', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Shadow Services', desc: 'Discreet personal assistance for hosts and key family members, ensuring their needs are met without them having to worry about logistical details.', ico: '👥', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Bride & Groom Assistance', desc: 'Dedicated personal shadows for the couple, managing their schedule, refreshments, and attire needs so they stay calm and radiant.', ico: '💍', img: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800' },
      { name: 'Artist Hospitality', desc: 'Professional management of performer needs, from green room setup to coordinate travel and timing for a flawless stage appearance.', ico: '🎤', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Vendor Coordination', desc: 'Acting as the central command for all event partners, managing timelines and quality control to ensure harmonious vendor collaboration.', ico: '🤝', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
      { name: 'Hotel Coordination', desc: 'Managing the critical interface between the event and hospitality properties, ensuring room readiness and seamless banquet operations.', ico: '🏨', img: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=800' },
      { name: 'Room Allocation', desc: 'Strategically managing guest room blocks and keys to ensure smooth arrival and comfortable lodging for all event attendees.', ico: '🔑', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
      { name: 'Guest Transportation', desc: 'Orchestrating complex transit schedules, including luxury car fleets and shuttle services for efficient movement between venues.', ico: '🚗', img: 'https://images.unsplash.com/photo-1532347922424-c652d9b7208e?auto=format&fit=crop&q=80&w=800' },
      { name: 'Airport Pickup & Drop', desc: 'Providing professional greeting services and coordinated transport for guests arriving and departing from regional airports.', ico: '✈️', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=80&w=800' },
      { name: 'Railway Pickup & Drop', desc: 'Ensuring reliable and timely transportation for guests traveling via rail, with dedicated staff for greeting and luggage assistance.', ico: '🚂', img: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=800' },
      { name: 'Logistics Management', desc: 'Comprehensive oversight of all material movement, equipment transport, and infrastructure setup requirements for a seamless event flow.', ico: '📦', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Event Coordination', desc: 'Master orchestration of the overall event schedule, managing the flow of activities and ensuring every moment happens according to plan.', ico: '📋', img: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800' },
      { name: 'Timeline Management', desc: 'Precise management of minute-by-minute itineraries, coordinating cues for ceremonies, performances, and dining services.', ico: '⏱️', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Backstage Management', desc: 'Professional control of the backstage environment, ensuring performers and speakers are ready for their cues with absolute precision.', ico: '🎭', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Green Room Management', desc: 'Creating and maintaining comfortable backstage retreats for artists and VIPs, managing their refreshments and technical requirements.', ico: '🍃', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800' },
      { name: 'Inventory Management', desc: 'Tracking and securing all event assets, from expensive decor props to technical equipment, throughout the setup and breakdown phases.', ico: '📋', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Permission & Compliance', desc: 'Navigating local regulations to secure all necessary event permits, including sound permissions, local body approvals, and safety clearances.', ico: '⚖️', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' },
      { name: 'Medical Assistance', desc: 'Providing peace of mind with on-site first aid support and established emergency medical protocols for the safety of all event attendees.', ico: '🚑', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800' }
    ]
  }
];
