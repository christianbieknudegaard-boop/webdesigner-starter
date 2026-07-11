// Fyller databasen med demodata. Kjør: npm run db:seed
// Demo-kontoene kan logge inn med passordet "bokfink123".
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const demoHash = bcrypt.hashSync("bokfink123", 10);

const SELLERS = [
  { id: "s1", name: "Ingrid H.", city: "Oslo", email: "ingrid@example.com", passwordHash: demoHash, rating: 4.9, salesCount: 128, memberSince: new Date("2023-02-14") },
  { id: "s2", name: "Magnus L.", city: "Bergen", email: "magnus@example.com", passwordHash: demoHash, rating: 4.7, salesCount: 54, memberSince: new Date("2024-06-01") },
  { id: "s3", name: "Sofie K.", city: "Trondheim", email: "sofie@example.com", passwordHash: demoHash, rating: 5.0, salesCount: 211, memberSince: new Date("2022-09-30") },
  { id: "s4", name: "Even R.", city: "Stavanger", email: "even@example.com", passwordHash: demoHash, rating: 4.5, salesCount: 33, memberSince: new Date("2025-01-12") },
];

const LISTINGS = [
  { id: "b1", title: "Halvbroren", author: "Lars Saabye Christensen", isbn: "9788202433666", category: "skjonnlitteratur", condition: "veldig-god", price: 89, originalPrice: 249, description: "Praktutgave i pocket, lest én gang. Ingen brettede sider eller notater. Sendes godt innpakket.", coverColor: "#2f5d50", sellerId: "s1", createdAt: new Date("2026-07-01"), sold: false },
  { id: "b2", title: "Kniv", author: "Jo Nesbø", isbn: "9788203373114", category: "krim", condition: "god", price: 65, originalPrice: 199, description: "Harry Hole på sitt beste. Noe slitasje på ryggen, ellers fin. Røykfritt hjem.", coverColor: "#7a3b3b", sellerId: "s2", createdAt: new Date("2026-07-03"), sold: false },
  { id: "b3", title: "Ringenes herre – Ringens brorskap", author: "J.R.R. Tolkien", isbn: "9788210053559", category: "fantasy", condition: "slitt", price: 49, originalPrice: 299, description: "Godt lest klassiker med sjel. Gulnede sider, men helt komplett og godt limt.", coverColor: "#5b4a2f", sellerId: "s3", createdAt: new Date("2026-06-20"), sold: false },
  { id: "b4", title: "Snømannen", author: "Jo Nesbø", isbn: "9788203192920", category: "krim", condition: "som-ny", price: 79, originalPrice: 199, description: "Helt ubrukt, fikk to i gave. Kan hentes i Trondheim sentrum.", coverColor: "#3d5a80", sellerId: "s3", createdAt: new Date("2026-07-07"), sold: false },
  { id: "b5", title: "Anatomi og fysiologi – arbeidsbok", author: "Olav Sand", isbn: "9788205426641", category: "pensum", condition: "veldig-god", price: 220, originalPrice: 499, description: "Pensum på sykepleien. Noen få markeringer med gul tusj i kapittel 1–3, ellers ren.", coverColor: "#446373", sellerId: "s4", createdAt: new Date("2026-06-28"), sold: false },
  { id: "b6", title: "Sapiens: En kort historie om menneskeheten", author: "Yuval Noah Harari", isbn: "9788280873781", category: "fakta", condition: "god", price: 99, originalPrice: 229, description: "Innbundet utgave. Litt bruksspor på omslaget, sidene er fine.", coverColor: "#8a6d3b", sellerId: "s1", createdAt: new Date("2026-07-05"), sold: false },
  { id: "b7", title: "Harry Potter og de vises stein", author: "J.K. Rowling", isbn: "9788202235352", category: "barn-og-ungdom", condition: "god", price: 70, originalPrice: 179, description: "Norsk utgave, perfekt som første Harry Potter-bok. Navnet til forrige eier står på innsiden av permen.", coverColor: "#6d3b8a", sellerId: "s2", createdAt: new Date("2026-07-08"), sold: false },
  { id: "b8", title: "Jeg er Zlatan", author: "Zlatan Ibrahimović og David Lagercrantz", isbn: "9788248911975", category: "biografi", condition: "veldig-god", price: 60, originalPrice: 149, description: "Lest én gang. Sendes samme dag som bestilling.", coverColor: "#374151", sellerId: "s4", createdAt: new Date("2026-06-15"), sold: true },
  { id: "b9", title: "Mikroøkonomi", author: "Robert Pindyck og Daniel Rubinfeld", isbn: "9781292213316", category: "pensum", condition: "god", price: 350, originalPrice: 899, description: "Pensum på NHH og BI. Engelsk utgave, 9. utgave. Understrekninger i blyant som kan viskes ut.", coverColor: "#2d4f6c", sellerId: "s1", createdAt: new Date("2026-07-09"), sold: false },
  { id: "b10", title: "Beartown", author: "Fredrik Backman", isbn: "9788253040288", category: "skjonnlitteratur", condition: "som-ny", price: 95, originalPrice: 249, description: "Som ny, plastet omslag. En av de beste bøkene jeg har lest!", coverColor: "#1f6f5c", sellerId: "s3", createdAt: new Date("2026-07-06"), sold: false },
  { id: "f1", productType: "film", format: "blu-ray", title: "Flåklypa Grand Prix", author: "Ivo Caprino", isbn: "7020560910136", category: "film-barn", condition: "veldig-god", price: 79, originalPrice: 199, description: "Norsk klassiker på Blu-ray. Kun sett to ganger, plateoverflaten er strøken.", coverColor: "#b3552f", sellerId: "s2", createdAt: new Date("2026-07-09"), sold: false },
  { id: "f2", productType: "film", format: "blu-ray", title: "Ringenes herre-trilogien (Extended Edition)", author: "Peter Jackson", isbn: "7340112717322", category: "film-action", condition: "god", price: 149, originalPrice: 399, description: "Alle tre filmene i utvidet versjon, 6 plater. Coveret har litt slitasje, platene er fine.", coverColor: "#3a4a2f", sellerId: "s4", createdAt: new Date("2026-07-08"), sold: false },
  { id: "f3", productType: "film", format: "dvd", title: "Kon-Tiki", author: "Joachim Rønning og Espen Sandberg", isbn: "7020560920128", category: "film-drama", condition: "som-ny", price: 49, originalPrice: 149, description: "DVD i plast, aldri åpnet.", coverColor: "#2f5d6d", sellerId: "s1", createdAt: new Date("2026-07-10"), sold: false },
  { id: "m1", productType: "musikk", format: "lp", title: "a-ha – Hunting High and Low", author: "a-ha", isbn: "0602557048414", category: "musikk-norsk", condition: "veldig-god", price: 199, originalPrice: 349, description: "2015-reutgivelsen på vinyl. Spilt få ganger, cover uten skader.", coverColor: "#4a3b6d", sellerId: "s3", createdAt: new Date("2026-07-10"), sold: false },
  { id: "m2", productType: "musikk", format: "lp", title: "Pink Floyd – The Dark Side of the Moon", author: "Pink Floyd", isbn: "5099902988313", category: "musikk-rock", condition: "god", price: 249, originalPrice: 399, description: "2011-remaster. Litt slitasje på coverhjørnene, platen spiller fint.", coverColor: "#1f1f2e", sellerId: "s2", createdAt: new Date("2026-07-09"), sold: false },
];

for (const seller of SELLERS) {
  await prisma.seller.upsert({
    where: { id: seller.id },
    update: seller,
    create: seller,
  });
}

for (const listing of LISTINGS) {
  await prisma.listing.upsert({
    where: { id: listing.id },
    update: listing,
    create: listing,
  });
}

console.log(
  `Seedet ${SELLERS.length} selgere og ${LISTINGS.length} annonser.`
);
await prisma.$disconnect();
