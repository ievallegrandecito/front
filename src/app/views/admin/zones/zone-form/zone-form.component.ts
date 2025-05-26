import {
  Component, EventEmitter, Input, OnInit, Output,
  OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Zone, ZoneService } from '../../../../core/services/zone.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-zone-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './zone-form.component.html',
  styleUrls: ['./zone-form.component.css']
})
export class ZoneFormComponent implements OnInit, OnChanges {
  @Output() cerrar = new EventEmitter<void>();
  @Output() zonaCreada = new EventEmitter<void>();
  @Input() editMode = false;
  @Input() zoneId?: string;

  form!: FormGroup;

  constructor(private fb: FormBuilder, private zoneService: ZoneService) {}

  ngOnInit(): void {
    console.log('⚙️ ZoneFormComponent.ngOnInit — editMode =', this.editMode, 'zoneId =', this.zoneId);

    const letrasYEspacios = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

    this.form = this.fb.group({
      name: [
        '', 
        [
          Validators.required,
          Validators.pattern(letrasYEspacios)
        ]
      ],
      description: [
        '', 
        [
          Validators.required,
          Validators.pattern(letrasYEspacios)
        ]
      ]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['zoneId'] && this.editMode && this.zoneId) {
      this.cargarZona();
    }
  }

  private cargarZona(): void {
    console.log('📥 Cargando zona desde el backend con ID:', this.zoneId);
    this.zoneService.getById(this.zoneId!).subscribe({
      next: (response) => {
        const zone = response.data;
        console.log('✅ Zona cargada para edición:', zone);
        this.form.patchValue({
          name: zone.name,
          description: zone.description,
        });
      },
      error: err => console.error('❌ Error cargando zona:', err)
    });
  }

  guardar(): void {
  console.log('💾 guardar() llamado, form válido:', this.form.valid);
  if (this.form.invalid) return;

  const mensaje = this.editMode
    ? '¿Deseas actualizar esta zona?'
    : '¿Deseas agregar esta nueva zona?';

  Swal.fire({
    title: '¿Estás seguro?',
    text: mensaje,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'No, cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      const payload: Zone = this.form.value;

      if (this.editMode && this.zoneId) {
        this.zoneService.update(this.zoneId, payload).subscribe({
          next: () => {
            console.log('✅ Zona actualizada');
            Swal.fire('Actualizado', 'La zona fue actualizada correctamente.', 'success');
            this.zonaCreada.emit();
            this.cerrar.emit();
          },
          error: err => {
            console.error('❌ Error actualizando zona:', err);
            Swal.fire('Error', 'No se pudo actualizar la zona.', 'error');
          }
        });
      } else {
        this.zoneService.create(payload).subscribe({
          next: () => {
            console.log('✅ Zona creada');
            Swal.fire('Registrado', 'La zona fue registrada correctamente.', 'success');
            this.zonaCreada.emit();
            this.cerrar.emit();
          },
          error: err => {
            console.error('❌ Error creando zona:', err);
            Swal.fire('Error', 'No se pudo registrar la zona.', 'error');
          }
        });
      }
    } else {
      console.log('⚠️ Acción cancelada por el usuario.');
    }
  });
}

  cancelar(): void {
    console.log('❎ cancelar() llamado');
    this.cerrar.emit();
  }
}
