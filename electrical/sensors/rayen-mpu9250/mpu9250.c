#include "stm32f4xx.h"
#include <math.h>

int16_t x, y, z;
int16_t gx, gy, gz;
uint8_t data[6];
uint8_t dummy;

float Ax, Ay, Az;
float Gx, Gy, Gz;
float pitch, pitchfi;
float roll, rollfi;
float dt = 0.005f;

void SPI1_Config(void) {
    RCC->AHB1ENR |= (1 << 0);
    RCC->APB2ENR |= (1 << 12);
    GPIOA->MODER |= (2 << 10) | (2 << 12) | (2 << 14);
    GPIOA->MODER |= (1 << 8);
    GPIOA->AFR[0] |= (5 << 20) | (5 << 24) | (5 << 28);
    SPI1->CR1 |= (1<<2)|(1<<4)|(1<<0)|(1<<1)|(1<<9)|(1<<8)|(1<<6);
}

void NSS_LOW(void)  { GPIOA->ODR &= ~(1 << 4); }
void NSS_HIGH(void) { GPIOA->ODR |=  (1 << 4); }

void comunication_SPI(uint8_t a) {
    while (!(SPI1->SR & (1 << 1)));
    SPI1->DR = a | 0x80;
    while (!(SPI1->SR & (1 << 0)));
    dummy = SPI1->DR;
    for (uint8_t i = 0; i < 6; i++) {
        while (!(SPI1->SR & (1 << 1)));
        SPI1->DR = 0x00;
        while (!(SPI1->SR & (1 << 0)));
        data[i] = SPI1->DR;
        while (SPI1->SR & (1 << 7));
    }
}

void supdata(void) {
    for (uint8_t i = 0; i < 6; i++) data[i] = 0x00;
}

void delay_ms(uint32_t ms) {
    for (uint32_t i = 0; i < ms * 1600; i++) __NOP();
}

void traitement(void) {
    Ax = x / 16384.0f;
    Ay = y / 16384.0f;
    Az = z / 16384.0f;
    Gx = gx / 131.0f;
    Gy = gy / 131.0f;

    // Roll: rotation around X axis (tilting left/right)
    roll = atan2f(Ay, sqrtf(Ax*Ax + Az*Az)) * 180.0f / 3.14159f;

    // Pitch: rotation around Y axis (tilting forward/back)
    pitch = atan2f(-Ax, sqrtf(Ay*Ay + Az*Az)) * 180.0f / 3.14159f;

    float alpha = 0.98f;
    rollfi  = alpha * (rollfi  + Gx * dt) + (1.0f - alpha) * roll;
    pitchfi = alpha * (pitchfi + Gy * dt) + (1.0f - alpha) * pitch;
}

void read_sensor(void) {
    NSS_LOW();
    comunication_SPI(0x3B);   // ACCEL_XOUT_H
    NSS_HIGH();
    x = (data[0] << 8) | data[1];
    y = (data[2] << 8) | data[3];
    z = (data[4] << 8) | data[5];
    supdata();

    NSS_LOW();
    comunication_SPI(0x43);   // GYRO_XOUT_H
    NSS_HIGH();
    gx = (data[0] << 8) | data[1];
    gy = (data[2] << 8) | data[3];
    gz = (data[4] << 8) | data[5];
    supdata();

    traitement();
}

int main(void) {
    SPI1_Config();
    delay_ms(500);
    while (1) {
        read_sensor();
        delay_ms(5);
    }
}