import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConstantsService } from '../../services/constants.service';
import { Constants } from '../../interfaces/constants.interface';

@Component({
  selector: 'app-constants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './constants.component.html',
  styleUrls: ['./constants.component.scss']
})
export class ConstantsComponent implements OnInit {
  constants: Constants | null = null;
  error: string = '';
  success: string = '';

  constructor(private constantsService: ConstantsService) {}

  ngOnInit(): void {
    this.loadConstants();
  }

  loadConstants(): void {
    this.constantsService.getConstants().subscribe({
      next: (constants) => {
        this.constants = constants;
        this.error = '';
      },
      error: (error) => {
        this.error = 'Error loading constants';
        console.error('Error:', error);
      }
    });
  }

  saveConstants(): void {
    if (!this.constants) return;

    this.constantsService.updateConstants(this.constants).subscribe({
      next: (response) => {
        this.success = 'Constants updated successfully';
        this.error = '';
        setTimeout(() => this.success = '', 3000);
      },
      error: (error) => {
        this.error = 'Error updating constants';
        this.success = '';
        console.error('Error:', error);
      }
    });
  }
}
