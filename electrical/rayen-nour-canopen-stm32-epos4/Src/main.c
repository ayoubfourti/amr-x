/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file           : main.c
  * @brief          : CANopen motor control
  ******************************************************************************
  */
/* USER CODE END Header */

/* Includes ------------------------------------------------------------------*/
#include "main.h"

/* Private includes ----------------------------------------------------------*/
/* USER CODE BEGIN Includes */

/* USER CODE END Includes */

/* Private typedef -----------------------------------------------------------*/
/* USER CODE BEGIN PTD */

/* USER CODE END PTD */

/* Private define ------------------------------------------------------------*/
/* USER CODE BEGIN PD */

#define MOTOR_NODE_ID              1

/* CANopen COB-IDs */
#define NMT_ID                      0x000
#define SDO_TX_ID                   (0x600 + MOTOR_NODE_ID)
#define SDO_RX_ID                   (0x580 + MOTOR_NODE_ID)

/* CiA-402 Object Dictionary */
#define OD_CONTROLWORD              0x6040
#define OD_STATUSWORD               0x6041
#define OD_MODE_OF_OPERATION        0x6060
#define OD_MODE_DISPLAY             0x6061
#define OD_TARGET_VELOCITY           0x60FF

/* CiA-402 Controlwords */
#define CONTROLWORD_SHUTDOWN         0x0006
#define CONTROLWORD_SWITCH_ON        0x0007
#define CONTROLWORD_ENABLE_OPERATION 0x000F
#define CONTROLWORD_DISABLE_VOLTAGE  0x0000

/* Profile Velocity mode */
#define MODE_PROFILE_VELOCITY        3

/* Change this value according to your motor drive */
#define MOTOR_TARGET_VELOCITY        1000

/* USER CODE END PD */

/* Private macro -------------------------------------------------------------*/
/* USER CODE BEGIN PM */

/* USER CODE END PM */

/* Private variables ---------------------------------------------------------*/

CAN_HandleTypeDef hcan1;

/* USER CODE BEGIN PV */

CAN_TxHeaderTypeDef TxHeader;
CAN_RxHeaderTypeDef RxHeader;

uint8_t TxData[8];
uint8_t RxData[8];

uint32_t TxMailbox;

volatile uint16_t ReceivedStatusword = 0;
volatile uint8_t StatuswordReceived = 0;

volatile uint8_t SDO_ResponseReceived = 0;
volatile uint8_t SDO_Error = 0;

volatile uint32_t LastTxError = 0;

/* USER CODE END PV */

/* Private function prototypes -----------------------------------------------*/

void SystemClock_Config(void);
static void MX_GPIO_Init(void);
static void MX_CAN1_Init(void);

/* USER CODE BEGIN PFP */

void CANopen_StartNode(uint8_t NodeID);

HAL_StatusTypeDef CANopen_Write16(uint16_t index,
                                  uint8_t subindex,
                                  uint16_t value);

HAL_StatusTypeDef CANopen_Read16(uint16_t index,
                                 uint8_t subindex);

void CANopen_ReadStatusword(void);

HAL_StatusTypeDef CANopen_SetMode(uint8_t mode);

HAL_StatusTypeDef CANopen_SetTargetVelocity(int32_t velocity);

HAL_StatusTypeDef CANopen_EnableMotor(void);

HAL_StatusTypeDef CANopen_StopMotor(void);

/* USER CODE END PFP */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */

/* USER CODE END 0 */


/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void)
{
  /* MCU Configuration--------------------------------------------------------*/

  HAL_Init();

  /* Configure the system clock */
  SystemClock_Config();

  /* Initialize all configured peripherals */
  MX_GPIO_Init();
  MX_CAN1_Init();


  /* USER CODE BEGIN 2 */

  /******************************************************************
   * CAN FILTER
   *
   * Accept all CAN IDs.
   ******************************************************************/

  CAN_FilterTypeDef canfilterconfig;

  canfilterconfig.FilterActivation = CAN_FILTER_ENABLE;
  canfilterconfig.FilterBank = 0;
  canfilterconfig.FilterFIFOAssignment = CAN_FILTER_FIFO0;
  canfilterconfig.FilterMode = CAN_FILTERMODE_IDMASK;
  canfilterconfig.FilterScale = CAN_FILTERSCALE_32BIT;

  canfilterconfig.FilterIdHigh = 0x0000;
  canfilterconfig.FilterIdLow = 0x0000;

  canfilterconfig.FilterMaskIdHigh = 0x0000;
  canfilterconfig.FilterMaskIdLow = 0x0000;

  if (HAL_CAN_ConfigFilter(&hcan1, &canfilterconfig) != HAL_OK)
  {
    Error_Handler();
  }


  /******************************************************************
   * START CAN
   ******************************************************************/

  if (HAL_CAN_Start(&hcan1) != HAL_OK)
  {
    Error_Handler();
  }


  /******************************************************************
   * ENABLE CAN RX INTERRUPT
   ******************************************************************/

  if (HAL_CAN_ActivateNotification(
        &hcan1,
        CAN_IT_RX_FIFO0_MSG_PENDING) != HAL_OK)
  {
    Error_Handler();
  }


  /******************************************************************
   * NMT START REMOTE NODE
   *
   * CAN ID = 0x000
   * DATA[0] = 0x01
   * DATA[1] = Node ID
   ******************************************************************/

  CANopen_StartNode(MOTOR_NODE_ID);

  HAL_Delay(100);


  /******************************************************************
   * SET PROFILE VELOCITY MODE
   *
   * Object 0x6060
   * Subindex 0
   * Value = 3
   ******************************************************************/

  if (CANopen_SetMode(MODE_PROFILE_VELOCITY) != HAL_OK)
  {
    Error_Handler();
  }

  HAL_Delay(100);


  /******************************************************************
   * CIA-402 STATE MACHINE
   *
   * Shutdown
   *      ↓
   * Switch On
   *      ↓
   * Enable Operation
   ******************************************************************/

  if (CANopen_Write16(
        OD_CONTROLWORD,
        0x00,
        CONTROLWORD_SHUTDOWN) != HAL_OK)
  {
    Error_Handler();
  }

  HAL_Delay(100);


  if (CANopen_Write16(
        OD_CONTROLWORD,
        0x00,
        CONTROLWORD_SWITCH_ON) != HAL_OK)
  {
    Error_Handler();
  }

  HAL_Delay(100);


  if (CANopen_Write16(
        OD_CONTROLWORD,
        0x00,
        CONTROLWORD_ENABLE_OPERATION) != HAL_OK)
  {
    Error_Handler();
  }

  HAL_Delay(100);


  /******************************************************************
   * READ STATUSWORD
   ******************************************************************/

  CANopen_ReadStatusword();

  HAL_Delay(100);


  /******************************************************************
   * SET TARGET VELOCITY
   *
   * Object 0x60FF
   ******************************************************************/

  if (CANopen_SetTargetVelocity(MOTOR_TARGET_VELOCITY) != HAL_OK)
  {
    Error_Handler();
  }

  HAL_Delay(100);


  /* USER CODE END 2 */


  /* Infinite loop */
  while (1)
  {
    /**************************************************************
     * READ STATUSWORD PERIODICALLY
     **************************************************************/

    CANopen_ReadStatusword();

    HAL_Delay(500);


    /**************************************************************
     * MOTOR REMAINS ENABLED
     *
     * Do NOT repeatedly send 0x0006 → 0x0007 → 0x000F here.
     *
     * The motor stays in Operation Enabled state.
     **************************************************************/


    /**************************************************************
     * EXAMPLE:
     *
     * To change motor velocity:
     *
     * CANopen_SetTargetVelocity(2000);
     *
     * or:
     *
     * CANopen_SetTargetVelocity(-1000);
     *
     **************************************************************/
  }
}


/**
  * @brief System Clock Configuration
  * @retval None
  */
void SystemClock_Config(void)
{
  RCC_OscInitTypeDef RCC_OscInitStruct = {0};
  RCC_ClkInitTypeDef RCC_ClkInitStruct = {0};

  __HAL_RCC_PWR_CLK_ENABLE();

  __HAL_PWR_VOLTAGESCALING_CONFIG(
      PWR_REGULATOR_VOLTAGE_SCALE1);

  RCC_OscInitStruct.OscillatorType =
      RCC_OSCILLATORTYPE_HSI;

  RCC_OscInitStruct.HSIState =
      RCC_HSI_ON;

  RCC_OscInitStruct.HSICalibrationValue =
      RCC_HSICALIBRATION_DEFAULT;

  RCC_OscInitStruct.PLL.PLLState =
      RCC_PLL_ON;

  RCC_OscInitStruct.PLL.PLLSource =
      RCC_PLLSOURCE_HSI;

  RCC_OscInitStruct.PLL.PLLM = 8;
  RCC_OscInitStruct.PLL.PLLN = 168;
  RCC_OscInitStruct.PLL.PLLP = RCC_PLLP_DIV2;
  RCC_OscInitStruct.PLL.PLLQ = 7;

  if (HAL_RCC_OscConfig(&RCC_OscInitStruct) != HAL_OK)
  {
    Error_Handler();
  }

  RCC_ClkInitStruct.ClockType =
      RCC_CLOCKTYPE_HCLK |
      RCC_CLOCKTYPE_SYSCLK |
      RCC_CLOCKTYPE_PCLK1 |
      RCC_CLOCKTYPE_PCLK2;

  RCC_ClkInitStruct.SYSCLKSource =
      RCC_SYSCLKSOURCE_PLLCLK;

  RCC_ClkInitStruct.AHBCLKDivider =
      RCC_SYSCLK_DIV1;

  RCC_ClkInitStruct.APB1CLKDivider =
      RCC_HCLK_DIV4;

  RCC_ClkInitStruct.APB2CLKDivider =
      RCC_HCLK_DIV2;

  if (HAL_RCC_ClockConfig(
        &RCC_ClkInitStruct,
        FLASH_LATENCY_5) != HAL_OK)
  {
    Error_Handler();
  }
}


/**
  * @brief CAN1 Initialization Function
  * @param None
  * @retval None
  */
static void MX_CAN1_Init(void)
{
  hcan1.Instance = CAN1;

  hcan1.Init.Prescaler = 6;

  hcan1.Init.Mode =
      CAN_MODE_NORMAL;

  hcan1.Init.SyncJumpWidth =
      CAN_SJW_1TQ;

  hcan1.Init.TimeSeg1 =
      CAN_BS1_11TQ;

  hcan1.Init.TimeSeg2 =
      CAN_BS2_2TQ;

  hcan1.Init.TimeTriggeredMode =
      DISABLE;

  hcan1.Init.AutoBusOff =
      DISABLE;

  hcan1.Init.AutoWakeUp =
      DISABLE;

  hcan1.Init.AutoRetransmission =
      ENABLE;

  hcan1.Init.ReceiveFifoLocked =
      DISABLE;

  hcan1.Init.TransmitFifoPriority =
      DISABLE;

  if (HAL_CAN_Init(&hcan1) != HAL_OK)
  {
    Error_Handler();
  }
}


/**
  * @brief GPIO Initialization Function
  * @param None
  * @retval None
  */
static void MX_GPIO_Init(void)
{
  GPIO_InitTypeDef GPIO_InitStruct = {0};

  /* GPIO Ports Clock Enable */

  __HAL_RCC_GPIOE_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();
  __HAL_RCC_GPIOH_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();
  __HAL_RCC_GPIOD_CLK_ENABLE();


  /* Configure GPIO pin Output Level */

  HAL_GPIO_WritePin(
      CS_I2C_SPI_GPIO_Port,
      CS_I2C_SPI_Pin,
      GPIO_PIN_RESET);

  HAL_GPIO_WritePin(
      OTG_FS_PowerSwitchOn_GPIO_Port,
      OTG_FS_PowerSwitchOn_Pin,
      GPIO_PIN_SET);

  HAL_GPIO_WritePin(
      GPIOD,
      LD4_Pin |
      LD3_Pin |
      LD5_Pin |
      LD6_Pin |
      Audio_RST_Pin,
      GPIO_PIN_RESET);


  /* CS_I2C_SPI */

  GPIO_InitStruct.Pin =
      CS_I2C_SPI_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_OUTPUT_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  HAL_GPIO_Init(
      CS_I2C_SPI_GPIO_Port,
      &GPIO_InitStruct);


  /* OTG_FS Power Switch */

  GPIO_InitStruct.Pin =
      OTG_FS_PowerSwitchOn_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_OUTPUT_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  HAL_GPIO_Init(
      OTG_FS_PowerSwitchOn_GPIO_Port,
      &GPIO_InitStruct);


  /* PDM OUT */

  GPIO_InitStruct.Pin =
      PDM_OUT_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_AF_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  GPIO_InitStruct.Alternate =
      GPIO_AF5_SPI2;

  HAL_GPIO_Init(
      PDM_OUT_GPIO_Port,
      &GPIO_InitStruct);


  /* User Button */

  GPIO_InitStruct.Pin =
      B1_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_IT_RISING;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  HAL_GPIO_Init(
      B1_GPIO_Port,
      &GPIO_InitStruct);


  /* I2S3 WS */

  GPIO_InitStruct.Pin =
      I2S3_WS_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_AF_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  GPIO_InitStruct.Alternate =
      GPIO_AF6_SPI3;

  HAL_GPIO_Init(
      I2S3_WS_GPIO_Port,
      &GPIO_InitStruct);


  /* SPI1 */

  GPIO_InitStruct.Pin =
      SPI1_SCK_Pin |
      SPI1_MISO_Pin |
      SPI1_MOSI_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_AF_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  GPIO_InitStruct.Alternate =
      GPIO_AF5_SPI1;

  HAL_GPIO_Init(
      GPIOA,
      &GPIO_InitStruct);


  /* BOOT1 */

  GPIO_InitStruct.Pin =
      BOOT1_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_INPUT;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  HAL_GPIO_Init(
      BOOT1_GPIO_Port,
      &GPIO_InitStruct);


  /* CLK IN */

  GPIO_InitStruct.Pin =
      CLK_IN_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_AF_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  GPIO_InitStruct.Alternate =
      GPIO_AF5_SPI2;

  HAL_GPIO_Init(
      CLK_IN_GPIO_Port,
      &GPIO_InitStruct);


  /* LEDs */

  GPIO_InitStruct.Pin =
      LD4_Pin |
      LD3_Pin |
      LD5_Pin |
      LD6_Pin |
      Audio_RST_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_OUTPUT_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  HAL_GPIO_Init(
      GPIOD,
      &GPIO_InitStruct);


  /* I2S3 */

  GPIO_InitStruct.Pin =
      I2S3_MCK_Pin |
      I2S3_SCK_Pin |
      I2S3_SD_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_AF_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  GPIO_InitStruct.Alternate =
      GPIO_AF6_SPI3;

  HAL_GPIO_Init(
      GPIOC,
      &GPIO_InitStruct);


  /* VBUS */

  GPIO_InitStruct.Pin =
      VBUS_FS_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_INPUT;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  HAL_GPIO_Init(
      VBUS_FS_GPIO_Port,
      &GPIO_InitStruct);


  /* USB */

  GPIO_InitStruct.Pin =
      OTG_FS_ID_Pin |
      OTG_FS_DM_Pin |
      OTG_FS_DP_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_AF_PP;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  GPIO_InitStruct.Alternate =
      GPIO_AF10_OTG_FS;

  HAL_GPIO_Init(
      GPIOA,
      &GPIO_InitStruct);


  /* USB OverCurrent */

  GPIO_InitStruct.Pin =
      OTG_FS_OverCurrent_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_INPUT;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  HAL_GPIO_Init(
      OTG_FS_OverCurrent_GPIO_Port,
      &GPIO_InitStruct);


  /* I2C */

  GPIO_InitStruct.Pin =
      Audio_SCL_Pin |
      Audio_SDA_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_AF_OD;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  GPIO_InitStruct.Speed =
      GPIO_SPEED_FREQ_LOW;

  GPIO_InitStruct.Alternate =
      GPIO_AF4_I2C1;

  HAL_GPIO_Init(
      GPIOB,
      &GPIO_InitStruct);


  /* MEMS */

  GPIO_InitStruct.Pin =
      MEMS_INT2_Pin;

  GPIO_InitStruct.Mode =
      GPIO_MODE_EVT_RISING;

  GPIO_InitStruct.Pull =
      GPIO_NOPULL;

  HAL_GPIO_Init(
      MEMS_INT2_GPIO_Port,
      &GPIO_InitStruct);
}


/* USER CODE BEGIN 4 */


/******************************************************************
 * CANopen Start Node
 *
 * CAN ID: 0x000
 *
 * DATA:
 * 01 = Start Remote Node
 * Node ID
 ******************************************************************/

void CANopen_StartNode(uint8_t NodeID)
{
  TxHeader.StdId = NMT_ID;
  TxHeader.ExtId = 0;

  TxHeader.IDE =
      CAN_ID_STD;

  TxHeader.RTR =
      CAN_RTR_DATA;

  TxHeader.DLC =
      2;

  TxHeader.TransmitGlobalTime =
      DISABLE;

  TxData[0] = 0x01;
  TxData[1] = NodeID;


  if (HAL_CAN_AddTxMessage(
        &hcan1,
        &TxHeader,
        TxData,
        &TxMailbox) != HAL_OK)
  {
    LastTxError =
        HAL_CAN_GetError(&hcan1);
  }
}


/******************************************************************
 * CANopen Write 16-bit Object
 *
 * SDO request:
 *
 * 2B IndexLow IndexHigh Subindex
 *    DataLow DataHigh 00 00
 *
 ******************************************************************/

HAL_StatusTypeDef CANopen_Write16(
    uint16_t index,
    uint8_t subindex,
    uint16_t value)
{
  TxHeader.StdId =
      SDO_TX_ID;

  TxHeader.ExtId =
      0;

  TxHeader.IDE =
      CAN_ID_STD;

  TxHeader.RTR =
      CAN_RTR_DATA;

  TxHeader.DLC =
      8;

  TxHeader.TransmitGlobalTime =
      DISABLE;


  TxData[0] =
      0x2B;

  TxData[1] =
      index & 0xFF;

  TxData[2] =
      (index >> 8) & 0xFF;

  TxData[3] =
      subindex;

  TxData[4] =
      value & 0xFF;

  TxData[5] =
      (value >> 8) & 0xFF;

  TxData[6] =
      0x00;

  TxData[7] =
      0x00;


  return HAL_CAN_AddTxMessage(
      &hcan1,
      &TxHeader,
      TxData,
      &TxMailbox);
}


/******************************************************************
 * CANopen Read 16-bit Object
 ******************************************************************/

HAL_StatusTypeDef CANopen_Read16(
    uint16_t index,
    uint8_t subindex)
{
  TxHeader.StdId =
      SDO_TX_ID;

  TxHeader.ExtId =
      0;

  TxHeader.IDE =
      CAN_ID_STD;

  TxHeader.RTR =
      CAN_RTR_DATA;

  TxHeader.DLC =
      8;

  TxHeader.TransmitGlobalTime =
      DISABLE;


  TxData[0] =
      0x40;

  TxData[1] =
      index & 0xFF;

  TxData[2] =
      (index >> 8) & 0xFF;

  TxData[3] =
      subindex;

  TxData[4] =
      0x00;

  TxData[5] =
      0x00;

  TxData[6] =
      0x00;

  TxData[7] =
      0x00;


  return HAL_CAN_AddTxMessage(
      &hcan1,
      &TxHeader,
      TxData,
      &TxMailbox);
}


/******************************************************************
 * Read Statusword
 *
 * Object = 0x6041
 ******************************************************************/

void CANopen_ReadStatusword(void)
{
  CANopen_Read16(
      OD_STATUSWORD,
      0x00);
}


/******************************************************************
 * Set Mode of Operation
 *
 * Object = 0x6060
 *
 * Value 3 = Profile Velocity Mode
 ******************************************************************/

HAL_StatusTypeDef CANopen_SetMode(
    uint8_t mode)
{
  TxHeader.StdId =
      SDO_TX_ID;

  TxHeader.ExtId =
      0;

  TxHeader.IDE =
      CAN_ID_STD;

  TxHeader.RTR =
      CAN_RTR_DATA;

  TxHeader.DLC =
      8;

  TxHeader.TransmitGlobalTime =
      DISABLE;


  /*
   * 0x2F = Write 1 byte
   */

  TxData[0] =
      0x2F;

  TxData[1] =
      OD_MODE_OF_OPERATION & 0xFF;

  TxData[2] =
      (OD_MODE_OF_OPERATION >> 8) & 0xFF;

  TxData[3] =
      0x00;

  TxData[4] =
      mode;

  TxData[5] =
      0x00;

  TxData[6] =
      0x00;

  TxData[7] =
      0x00;


  return HAL_CAN_AddTxMessage(
      &hcan1,
      &TxHeader,
      TxData,
      &TxMailbox);
}


/******************************************************************
 * Set Target Velocity
 *
 * Object = 0x60FF
 *
 * 32-bit signed value
 *
 ******************************************************************/

HAL_StatusTypeDef CANopen_SetTargetVelocity(
    int32_t velocity)
{
  TxHeader.StdId =
      SDO_TX_ID;

  TxHeader.ExtId =
      0;

  TxHeader.IDE =
      CAN_ID_STD;

  TxHeader.RTR =
      CAN_RTR_DATA;

  TxHeader.DLC =
      8;

  TxHeader.TransmitGlobalTime =
      DISABLE;


  /*
   * 0x23 = Write 4 bytes
   */

  TxData[0] =
      0x23;

  TxData[1] =
      OD_TARGET_VELOCITY & 0xFF;

  TxData[2] =
      (OD_TARGET_VELOCITY >> 8) & 0xFF;

  TxData[3] =
      0x00;


  TxData[4] =
      (uint8_t)(velocity & 0xFF);

  TxData[5] =
      (uint8_t)((velocity >> 8) & 0xFF);

  TxData[6] =
      (uint8_t)((velocity >> 16) & 0xFF);

  TxData[7] =
      (uint8_t)((velocity >> 24) & 0xFF);


  return HAL_CAN_AddTxMessage(
      &hcan1,
      &TxHeader,
      TxData,
      &TxMailbox);
}


/******************************************************************
 * Enable Motor
 ******************************************************************/

HAL_StatusTypeDef CANopen_EnableMotor(void)
{
  HAL_StatusTypeDef status;


  /* Shutdown */

  status =
      CANopen_Write16(
          OD_CONTROLWORD,
          0x00,
          CONTROLWORD_SHUTDOWN);

  if (status != HAL_OK)
  {
    return status;
  }

  HAL_Delay(100);


  /* Switch On */

  status =
      CANopen_Write16(
          OD_CONTROLWORD,
          0x00,
          CONTROLWORD_SWITCH_ON);

  if (status != HAL_OK)
  {
    return status;
  }

  HAL_Delay(100);


  /* Enable Operation */

  status =
      CANopen_Write16(
          OD_CONTROLWORD,
          0x00,
          CONTROLWORD_ENABLE_OPERATION);

  if (status != HAL_OK)
  {
    return status;
  }

  HAL_Delay(100);


  return HAL_OK;
}


/******************************************************************
 * Stop Motor
 ******************************************************************/

HAL_StatusTypeDef CANopen_StopMotor(void)
{
  return CANopen_Write16(
      OD_CONTROLWORD,
      0x00,
      CONTROLWORD_DISABLE_VOLTAGE);
}


/******************************************************************
 * CAN RX CALLBACK
 ******************************************************************/

void HAL_CAN_RxFifo0MsgPendingCallback(
    CAN_HandleTypeDef *hcan)
{
  if (hcan->Instance != CAN1)
  {
    return;
  }


  if (HAL_CAN_GetRxMessage(
        hcan,
        CAN_RX_FIFO0,
        &RxHeader,
        RxData) != HAL_OK)
  {
    return;
  }


  /***************************************************************
   * SDO RESPONSE FROM MOTOR
   *
   * Node ID 1:
   *
   * TX from master = 0x601
   * RX from motor  = 0x581
   ***************************************************************/

  if (RxHeader.StdId == SDO_RX_ID)
  {
    SDO_ResponseReceived = 1;


    /*************************************************************
     * SDO ERROR RESPONSE
     *
     * 0x80 = Abort transfer
     *************************************************************/

    if (RxData[0] == 0x80)
    {
      SDO_Error = 1;

      return;
    }


    /*************************************************************
     * STATUSWORD RESPONSE
     *
     * 0x4B 41 60 00 LL HH 00 00
     *************************************************************/

    if ((RxData[0] == 0x4B) &&
        (RxData[1] == 0x41) &&
        (RxData[2] == 0x60) &&
        (RxData[3] == 0x00))
    {
      ReceivedStatusword =
          ((uint16_t)RxData[5] << 8) |
          RxData[4];

      StatuswordReceived = 1;
    }
  }
}


/* USER CODE END 4 */


/**
  * @brief  This function is executed in case of error occurrence.
  * @retval None
  */
void Error_Handler(void)
{
  __disable_irq();

  while (1)
  {
  }
}


#ifdef USE_FULL_ASSERT

/**
  * @brief  Reports the name of the source file and the source line number
  * @param  file: pointer to the source file name
  * @param  line: assert_param error line source number
  * @retval None
  */
void assert_failed(
    uint8_t *file,
    uint32_t line)
{
  /* USER CODE BEGIN 6 */

  /* USER CODE END 6 */
}

#endif /* USE_FULL_ASSERT */
