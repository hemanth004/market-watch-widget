import { Component, ViewChild, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { MarketWatch } from './Components/market-watch/market-watch';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ MarketWatch],
  templateUrl: './app.html',
  styleUrl: './app.scss',

})
export class App {
  @ViewChild('aboutSection') aboutSection!: ElementRef;
  @ViewChild('aboutTrack') aboutTrack!: ElementRef;

  totalSlides = 5;

  ngAfterViewInit(): void {
    this.onScroll(); // initialize position
  }

  @HostListener('window:scroll', [])
  onScroll() {

    if (!this.aboutSection || !this.aboutTrack) return;

    const section = this.aboutSection.nativeElement;
    const track = this.aboutTrack.nativeElement;

    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const maxScroll = section.offsetHeight - windowHeight;

    if (rect.top <= 0 && Math.abs(rect.top) <= maxScroll) {

      const scrollProgress = Math.abs(rect.top) / maxScroll;

      const translateX =
        scrollProgress * (this.totalSlides - 1) * 100;

      track.style.transform = `translateX(-${translateX}vw)`;
    }
  }
}


