import * as THREE from "three";
import * as d3 from "d3";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { LightProbeGenerator } from "three/examples/jsm/lights/LightProbeGenerator.js";
import { CSM } from 'three/examples/jsm/csm/CSM.js';
import { CSMHelper } from 'three/examples/jsm/csm/CSMHelper.js';

import chinajsonData from './json/china.json'

export default class Map {
  constructor(container, el) {
    console.log('构建', container, el)
    this.container = container ? container : document.body;
    this.el = el;
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.provinceInfo = el
    this.camera = null
    this.renderer = null
    this.scene = null
    this.ambientLight = null
    this.raycaster = null
    this.mouse = null
    this.controller = null
    this.tooltip = document.getElementById('tooltip') || null
  }
  init() {
    // 第一步新建一个场景
    this.scene = new THREE.Scene()
    this.setCamera()
    this.setRenderer()
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    this.cube = new THREE.Mesh(geometry, material)
    this.scene.add(this.cube)
    this.loadMapData();
    this.render();
    this.setRaycaster();
    this.animate();
    this.addHelper();
    this.setController();
  }
  // 新建透视相机
  setCamera() {
    // 第二参数就是 长度和宽度比 默认采用浏览器  返回以像素为单位的窗口的内部宽度和高度
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000
    )

    this.camera.position.z = 60
  }
  // 设置渲染器
  setRenderer() {
    this.renderer = new THREE.WebGLRenderer()
    // 设置画布的大小
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0xffffff)
    // 渲染器的阴影
    this.renderer.shadowMap.enabled = true
    // 渲染器的阴影类型
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // 渲染器的阴影类型
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // 渲染器的阴影类型

    //这里 其实就是canvas 画布  renderer.domElement
    this.container.appendChild(this.renderer.domElement)
  }

  // 设置环境光
  setLight() {
    this.ambientLight = new THREE.AmbientLight(0xffffff) // 环境光
    this.scene.add(ambientLight)
  }

  //render 方法 
  render() {
    this.renderer.render(this.scene, this.camera)
  }

  loadMapData() {
    this.generateGeometry(chinajsonData)
  }

  generateGeometry(jsondata) {
    // 初始化一个地图对象
    console.log('generateGeometry', jsondata)
    this.map = new THREE.Object3D()
    // 墨卡托投影转换
    const projection = d3
      .geoMercator()
      .center([104.0, 37.5])
      .scale(80)
      .translate([0, 0])

    jsondata.features.forEach((elem) => {
      // 定一个省份3D对象
      const province = new THREE.Object3D()
      province.properties = elem.properties
      const coordinates = elem.geometry.coordinates
      // 循环坐标数组
      coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon) => {
          const shape = new THREE.Shape()

          const lineGeometry = new THREE.BufferGeometry()

          const pointsArray = new Array()
          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = projection(polygon[i])
            if (i === 0) {
              shape.moveTo(x, -y)
            }
            shape.lineTo(x, -y)
            pointsArray.push(new THREE.Vector3(x, -y, 4.01))
          }
          lineGeometry.setFromPoints(pointsArray)

          const extrudeSettings = {
            depth: 10,
            bevelEnabled: false,
          }

          const geometry = new THREE.ExtrudeGeometry(
            shape,
            extrudeSettings
          )
          const material = new THREE.MeshBasicMaterial({
            color: '#2defff',
            transparent: true,
            opacity: 0.6,
          })
          const material1 = new THREE.MeshBasicMaterial({
            color: '#3480C4',
            transparent: true,
            opacity: 0.5,
          })

          const lineMaterial = new THREE.LineBasicMaterial({
            color: 'white',
          })

          const mesh = new THREE.Mesh(geometry, [material, material1])
          const line = new THREE.Line(lineGeometry, lineMaterial)
          province.add(mesh)
          province.add(line)
        })
      })

      this.map.add(province)
    })

    this.scene.add(this.map)
  }

  addHelper() {
    const helper = new THREE.CameraHelper(this.camera)
    this.scene.add(helper)
  }

  setController() {
    this.controller = new OrbitControls(
      this.camera,
      this.renderer.domElement
    )
  }

  setRaycaster() {
    // 射线追踪器
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    const onMouseMove = (event) => {
      // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      // 更改div位置
      this.tooltip.style.left = event.clientX + 2 + 'px'
      this.tooltip.style.top = event.clientY + 2 + 'px'
    }
    window.addEventListener('mousemove', onMouseMove, false)
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this))
    // 通过摄像机和鼠标位置更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera)
    // 算出射线 与当场景相交的对象有那些
    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    )
    // 恢复上一次清空的
    if (this.lastPick) {
      this.lastPick.object.material[0].color.set('#2defff')
      this.lastPick.object.material[1].color.set('#3480C4')

      const properties = this.lastPick.object.parent.properties

      this.tooltip.textContent = properties.name

      this.tooltip.style.visibility = 'visible'
    } else {
      this.tooltip.style.visibility = 'hidden'
    }
    this.lastPick = null
    this.lastPick = intersects.find(
      (item) => item.object.material && item.object.material.length === 2
    )
    if (this.lastPick) {
      this.lastPick.object.material[0].color.set(0xff0000)
      this.lastPick.object.material[1].color.set(0xff0000)
    }

    this.render()
  }
  showTip() {
    // 显示省份的信息
    if (this.lastPick) {
      const properties = this.lastPick.object.parent.properties

      this.tooltip.textContent = properties.name

      this.tooltip.style.visibility = 'visible'
    } else {
      this.tooltip.style.visibility = 'hidden'
    }
  }


}